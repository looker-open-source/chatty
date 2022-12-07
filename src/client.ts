/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import * as debugLib from 'debug'
import type {
  AbortControllerStore,
  CallbackStore,
  Options,
  Receiver,
} from './types'
import type { ChattyClientBuilder } from './client_builder'
import { ChattyClientMessages } from './client_messages'
import { ChattyHostMessages } from './host_messages'
import 'es6-promise/auto' // Polyfill only browsers without Promises

/**
 * @private
 * Client connection status
 */

export enum ChattyClientStates {
  Connecting,
  Syn,
  Connected,
}

/**
 * The client connection to the host.
 */

export interface ChattyClientConnection {
  /**
   * Send a message to the host via a message channel.
   *
   * @param eventName The name of the event to send to the host
   * @param payload Additional data to send to host. Restricted to transferable objects, ownership of the
   * object will be transferred to the host.
   */

  send(eventName: string, ...payload: any[]): void

  /**
   * Send a message to the host via a message channel, and then await a response. The event listener in
   * the host returns a value or a promise that is resolved at some later point. This call will timeout
   * if the default timeout is a positive number. An alternate mechanism is to pass in an options
   * [[Options]] object as the last function parameter. In this scenerio, the default timeout is
   * ignored. The caller can then implement their own timeout by utilizing the abort signal.
   *
   * @param eventName The name of the event to send to the host
   * @param payload Additional data to send to host. Restricted to transferable objects, ownership of the
   * object will be transferred to the host.
   * @param options [[Options]]. Options can include an AbortController signal to allow request to be
   *        cancelled. If signal is set, the defaultTimeout is ignored.
   * @returns A Promise that will resolve when the host event handler returns. The promise will reject
   * if no response is received within [[ChattyClientBuilder.withDefaultTimeout]] milliseconds. The
   * response will be an array containing all responses from any registered event handlers on the host.
   */

  sendAndReceive(eventName: string, ...payload: any[]): Promise<any[]>
}

/**
 * The client object for an iframe. The user should not create this object directly, it
 * is returned by the [[ChattyClientBuilder.build]] method.
 */

export class ChattyClient {
  private static _debug = debugLib('looker:chatty:client')

  private _clientWindow = window
  private _connection: Promise<ChattyClientConnection> | null = null
  private _channel: MessageChannel
  private _hostWindow = this._clientWindow.parent
  private _handlers: CallbackStore
  private _abortControllers: AbortControllerStore
  private _targetOrigin: string
  private _state = ChattyClientStates.Connecting
  private _defaultTimeout: number
  private _sequence = 0
  private _receivers: { [key: number]: Receiver } = {}

  /**
   * @param builder The client builder that is responsible for constructing this object.
   * @hidden
   */

  constructor(builder: ChattyClientBuilder) {
    this._handlers = builder.handlers
    this._abortControllers = {}
    this._targetOrigin = builder.targetOrigin
    this._defaultTimeout = builder.defaultTimeout
    this._channel = new MessageChannel()
  }

  /**
   * @returns a Promise to an object that resolves when the host has acknowledged the connection.
   */

  get connection() {
    return this._connection
  }

  /**
   * @returns a flag indicating whether the client has successfully connected to the host.
   */

  get isConnected() {
    return this._state === ChattyClientStates.Connected
  }

  /**
   * Connects to the host window.
   * @returns a Promise to an object that resolves when the host has acknowledged the connection. The
   * object implements the [[ChattyClientConnection]] interface that can be used to talk to the host.
   */

  async connect(): Promise<ChattyClientConnection> {
    if (this._connection) return this._connection
    this._connection = new Promise((resolve, reject) => {
      this._channel.port1.onmessage = (evt) => {
        ChattyClient._debug('received', evt.data.action, evt.data.data)
        switch (evt.data.action) {
          case ChattyHostMessages.SynAck:
            this._state = ChattyClientStates.Connected
            this.sendMsg(ChattyClientMessages.Ack)
            resolve({
              send: (eventName: string, ...payload: any[]) => {
                this.sendMsg(ChattyClientMessages.Message, {
                  eventName,
                  payload,
                })
              },

              sendAndReceive: async (eventName: string, ..._payload: any[]) => {
                let signal: AbortSignal | undefined
                let propagateSignal: boolean | undefined
                let payload: any[]
                if (
                  _payload.length > 0 &&
                  _payload[_payload.length - 1].signal &&
                  _payload[_payload.length - 1].signal instanceof AbortSignal
                ) {
                  const options: Options = _payload[_payload.length - 1]
                  signal = options.signal
                  propagateSignal = options.propagateSignal
                  payload = _payload.slice(0, _payload.length - 1)
                } else {
                  payload = _payload
                }
                const sequence = ++this._sequence
                this.sendMsg(
                  ChattyClientMessages.MessageWithResponse,
                  { eventName, payload },
                  sequence,
                  propagateSignal
                )
                return new Promise<any>((resolve, reject) => {
                  let timeoutId
                  if (signal) {
                    signal.addEventListener('abort', (event) => {
                      let errorMessage = (event.target as AbortSignal).reason
                      if (typeof errorMessage !== 'string') {
                        errorMessage = 'Abort'
                      }
                      if (propagateSignal) {
                        this.sendMsg(
                          ChattyClientMessages.AbortMessage,
                          {
                            eventName,
                            payload: { reason: errorMessage },
                          },
                          sequence
                        )
                      }
                      delete this._receivers[sequence]
                      reject(new Error(errorMessage))
                    })
                  } else {
                    if (this._defaultTimeout > -1) {
                      timeoutId = setTimeout(() => {
                        delete this._receivers[sequence]
                        reject(new Error('Timeout'))
                      }, this._defaultTimeout)
                    }
                  }
                  this._receivers[sequence] = { reject, resolve, timeoutId }
                })
              },
            })
            break
          case ChattyHostMessages.Message:
            if (this._handlers[evt.data.data.eventName]) {
              this._handlers[evt.data.data.eventName].forEach((fn) =>
                fn.apply(this, evt.data.data.payload)
              )
            }
            break
          case ChattyHostMessages.MessageWithResponse:
            {
              const { eventName, payload, sequence, signal } = evt.data.data
              let results = []
              const abortStoreName = `${eventName}${sequence}`
              if (this._handlers[eventName]) {
                let _payload: any[]
                if (signal) {
                  this._abortControllers[abortStoreName] = new AbortController()
                  if (Array.isArray(payload)) {
                    _payload = [
                      ...payload,
                      this._abortControllers[abortStoreName].signal,
                    ]
                  } else {
                    _payload = [
                      payload,
                      this._abortControllers[abortStoreName].signal,
                    ]
                  }
                } else {
                  _payload = payload
                }
                results = this._handlers[eventName].map((fn) =>
                  fn.apply(this, _payload)
                )
              }
              Promise.all(results)
                .then((resolvedResults) => {
                  delete this._abortControllers[abortStoreName]
                  this.sendMsg(
                    ChattyClientMessages.Response,
                    { eventName, payload: resolvedResults },
                    sequence
                  )
                })
                .catch((error) => {
                  delete this._abortControllers[abortStoreName]
                  this.sendMsg(
                    ChattyClientMessages.ResponseError,
                    { eventName, payload: error.toString() },
                    sequence
                  )
                })
            }
            break
          case ChattyHostMessages.AbortMessage:
            {
              const { eventName, payload, sequence } = evt.data.data
              const abortStoreName = `${eventName}${sequence}`
              if (this._abortControllers[abortStoreName]) {
                this._abortControllers[abortStoreName].abort(payload?.reason)
                delete this._abortControllers[abortStoreName]
              }
            }
            break
          case ChattyHostMessages.Response:
            {
              const receiver = this._receivers[evt.data.data.sequence]
              if (receiver) {
                delete this._receivers[evt.data.data.sequence]
                if (receiver.timeoutId) {
                  clearTimeout(receiver.timeoutId)
                }
                receiver.resolve(evt.data.data.payload)
              }
            }
            break
          case ChattyHostMessages.ResponseError:
            {
              const receiver = this._receivers[evt.data.data.sequence]
              if (receiver) {
                delete this._receivers[evt.data.data.sequence]
                if (receiver.timeoutId) {
                  clearTimeout(receiver.timeoutId)
                }
                receiver.reject(
                  typeof evt.data.data.payload === 'string'
                    ? new Error(evt.data.data.payload)
                    : evt.data.data.payload
                )
              }
            }
            break
        }
      }

      this.initiateHandshake()
    })
    return this._connection
  }

  private initiateHandshake() {
    ChattyClient._debug('connecting to', this._targetOrigin)
    this._hostWindow.postMessage(
      {
        action: ChattyClientMessages.Syn,
      },
      this._targetOrigin,
      [this._channel.port2]
    )
    this._state = ChattyClientStates.Syn
  }

  private sendMsg(
    action: ChattyClientMessages,
    data: any = {},
    sequence?: number,
    propagateSignal?: boolean
  ) {
    const sequenceData = sequence ? { sequence } : {}
    const signalData =
      propagateSignal === true ? { signal: propagateSignal } : {}
    const dataWithSequence = { ...data, ...sequenceData, ...signalData }
    ChattyClient._debug('sending', action, dataWithSequence)
    this._channel.port1.postMessage({ action, data: dataWithSequence })
  }
}
