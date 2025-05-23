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
import type { ChattyHostBuilder } from './host_builder'
import { ChattyClientMessages } from './client_messages'
import { ChattyHostMessages } from './host_messages'
import 'es6-promise/auto' // Polyfill only browsers without Promises

/**
 * @private
 * Host connection status
 */

export enum ChattyHostStates {
  Connecting,
  SynAck,
  Connected,
}

/**
 * The Host connection to the client.
 */

export interface ChattyHostConnection {
  /**
   * Send a message to the client via a message channel.
   *
   * @param eventName The name of the event to send to the client
   * @param payload Additional data to send to the client. Restricted to transferable objects, ownership of the
   * object will be transferred to the client.
   */

  send(eventName: string, ...payload: any[]): void

  /**
   * Send a message to the client via a message channel, and then await a response. The event listener in
   * the client returns a value or a promise that is resolved at some later point. This call will timeout
   * if the default timeout is a positive number. An alternate mechanism is to pass in an options
   * [[Options]] object as the last function parameter. In this scenerio, the default timeout is
   * ignored. The caller can then implement their own timeout by utilizing the abort signal.
   *
   * @param eventName The name of the event to send to the client
   * @param payload Additional data to send to client. Restricted to transferable objects, ownership of the
   * object will be transferred to the client.
   * @param options [[Options]]. Options can include an AbortController signal to allow request to be
   *        cancelled. If signal is set, the defaultTimeout is ignored.
   * @returns A Promise that will resolve when the client event handler returns. The promise will reject
   * if no response is received within [[ChattyClientBuilder.withDefaultTimeout]] milliseconds. The
   * response will be an array containing all responses from any registered event handlers on the client.
   */

  sendAndReceive(eventName: string, ...payload: any[]): Promise<any>
}

/**
 * The host object for an iframe. The user should not create this object directly, it
 * is returned by the [[ChattyHostBuilder.build]] method.
 */

export class ChattyHost {
  private static _debug = debugLib('looker:chatty:host')

  /**
   * The underlying iframe element
   */
  public iframe: HTMLIFrameElement

  private _hostWindow = window
  private _appendTo: HTMLElement
  private _connection: Promise<ChattyHostConnection> | null = null
  private _port: MessagePort | null
  private _handlers: CallbackStore
  private _abortControllers: AbortControllerStore
  private _targetOrigin: string | null
  private _state = ChattyHostStates.Connecting
  private _defaultTimeout: number
  private _sequence = 0
  private _receivers: { [key: number]: Receiver } = {}

  /**
   * @param builder The client builder that is responsible for constructing this object.
   * @hidden
   */

  constructor(builder: ChattyHostBuilder) {
    this.iframe = document.createElement('iframe')
    builder.sandboxAttrs.forEach((attr) => this.iframe.sandbox.add(attr))
    if ('allow' in this.iframe) {
      this.iframe.allow = builder.allowAttrs.join('; ')
    }
    // tslint:disable-next-line:deprecation
    this.iframe.frameBorder = builder.getFrameBorder()
    if (builder.url) {
      this.iframe.src = builder.url
    } else if (builder.source) {
      this.iframe.srcdoc = builder.source
    } else {
      console.warn('url or source required to initialize Chatty host correctly')
    }
    if (builder.ariaLabel) {
      this.iframe.ariaLabel = builder.ariaLabel
    }
    this._appendTo = builder.el
    this._handlers = builder.handlers
    this._abortControllers = {}
    this._port = null
    this._targetOrigin = builder.targetOrigin
    this._defaultTimeout = builder.defaultTimeout
  }

  /**
   * @returns a Promise to an object that resolves when the client initiates the connection.
   */

  get connection() {
    return this._connection
  }

  /**
   * @returns a flag indicating whether the client successfully connected to the host.
   */

  get isConnected() {
    return this._state === ChattyHostStates.Connected
  }

  /**
   * Connects to the client iframe. Waits for the client iframe to load and initiate a
   * connection using the chatty client.
   *
   * @returns a Promise to an object that resolves when the client has initiated the connection. The
   * object implements the [[ChattyHostConnection]] that can be used to talk to the host.
   */

  async connect(): Promise<ChattyHostConnection> {
    if (this._connection) return this._connection

    const createConnection = async () => {
      return new Promise<ChattyHostConnection>((resolve, reject) => {
        const eventListener = (evt: MessageEvent) => {
          ChattyHost._debug('port received', evt.data.action, evt.data.data)

          switch (evt.data.action) {
            case ChattyClientMessages.Ack:
              this._state = ChattyHostStates.Connected
              resolve({
                send: (eventName: string, ...payload: any[]) => {
                  this.sendMsg(ChattyHostMessages.Message, {
                    eventName,
                    payload,
                  })
                },

                sendAndReceive: async (
                  eventName: string,
                  ..._payload: any[]
                ) => {
                  let signal: AbortSignal | undefined
                  let propagateSignal: boolean | undefined
                  let payload: any[]
                  if (
                    _payload.length > 0 &&
                    _payload[_payload.length - 1]?.signal &&
                    _payload[_payload.length - 1]?.signal instanceof AbortSignal
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
                    ChattyHostMessages.MessageWithResponse,
                    { eventName, payload },
                    sequence,
                    propagateSignal
                  )
                  return new Promise<any>((resolve, reject) => {
                    let timeoutId
                    if (signal) {
                      signal.addEventListener('abort', (event) => {
                        if (propagateSignal) {
                          let errorMessage = (event.target as AbortSignal)
                            .reason
                          if (typeof errorMessage !== 'string') {
                            errorMessage = 'Abort'
                          }
                          this.sendMsg(
                            ChattyHostMessages.AbortMessage,
                            {
                              eventName,
                              payload: { reason: errorMessage },
                            },
                            sequence
                          )
                        }
                        delete this._receivers[sequence]
                        let errorMessage = (event.target as AbortSignal).reason
                        if (typeof errorMessage !== 'string') {
                          errorMessage = 'Abort'
                        }
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
            case ChattyClientMessages.Message:
              if (this._handlers[evt.data.data.eventName]) {
                this._handlers[evt.data.data.eventName].forEach((fn) =>
                  fn.apply(this, evt.data.data.payload)
                )
              }
              break
            case ChattyClientMessages.MessageWithResponse:
              {
                const { eventName, payload, sequence, signal } = evt.data.data
                let results: any = []
                const abortStoreName = `${eventName}${sequence}`
                if (this._handlers[eventName]) {
                  let _payload: any[]
                  if (signal) {
                    this._abortControllers[abortStoreName] =
                      new AbortController()
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
                      ChattyHostMessages.Response,
                      { eventName, payload: resolvedResults },
                      sequence
                    )
                  })
                  .catch((error) => {
                    delete this._abortControllers[abortStoreName]
                    this.sendMsg(
                      ChattyHostMessages.ResponseError,
                      { eventName, payload: error.toString() },
                      sequence
                    )
                  })
              }
              break
            case ChattyClientMessages.AbortMessage:
              {
                const { eventName, payload, sequence } = evt.data.data
                const abortStoreName = `${eventName}${sequence}`
                if (this._abortControllers[abortStoreName]) {
                  this._abortControllers[abortStoreName].abort(payload?.reason)
                  delete this._abortControllers[abortStoreName]
                }
              }
              break
            case ChattyClientMessages.Response:
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
            case ChattyClientMessages.ResponseError:
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

        const windowListener = (evt: MessageEvent) => {
          if (!this.isValidMsg(evt)) {
            // don't reject here, since that breaks the promise resolution chain
            ChattyHost._debug('window received invalid', evt)
            return
          }
          ChattyHost._debug('window received', evt.data.action, evt.data.data)
          switch (evt.data.action) {
            case ChattyClientMessages.Syn:
              if (this._port) {
                // If targetOrigin is set and we receive another Syn, the frame has potentially
                // navigated to another valid webpage and we should re-connect
                if (
                  (this._targetOrigin && this._targetOrigin === '*') ||
                  this._targetOrigin === evt.origin
                ) {
                  ChattyHost._debug('reconnecting to', evt.origin)
                  this._port.close()
                } else {
                  ChattyHost._debug('rejected new connection from', evt.origin)
                  return
                }
              }
              this._port = evt.ports[0]
              this._port.onmessage = eventListener
              this.sendMsg(ChattyHostMessages.SynAck)
              this._state = ChattyHostStates.SynAck
              break
          }
        }

        this._hostWindow.addEventListener('message', windowListener)
      })
    }

    this._appendTo.appendChild(this.iframe)
    return (this._connection = createConnection())
  }

  private sendMsg(
    action: ChattyHostMessages,
    data: Record<string, unknown> = {},
    sequence?: number,
    propagateSignal?: boolean
  ) {
    const sequenceData = sequence ? { sequence } : {}
    const signalData =
      propagateSignal === true ? { signal: propagateSignal } : {}
    const dataWithSequence = { ...data, ...sequenceData, ...signalData }
    ChattyHost._debug('sending', action, dataWithSequence)
    this._port!.postMessage({ action, data: dataWithSequence })
  }

  // TODO: natenate
  // Frustratingly, enabling `allow-scripts` on a sandboxed iframe sets its origin to `'null'`
  // (that is, a string literal with a value of null). This means that in order to `postMessage`
  // to the client we must use `'*'` as the origin parameter.  To ensure messages received from
  // the client are who they claim to be, we check the origin is `'null'` and the contentWindow
  // is the one we have access to from the parent frame.  This method is described here:
  // https://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/#safely-sandboxing-eval
  // If sandboxing is not enabled targetOrigin can be set and validated
  private isValidMsg(evt: MessageEvent) {
    if (evt.source !== this.iframe.contentWindow) return false
    if (
      this._targetOrigin &&
      !(this._targetOrigin === '*' || this._targetOrigin === evt.origin)
    )
      return false
    return true
  }
}
