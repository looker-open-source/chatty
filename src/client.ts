/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { CallbackStore, Receiver } from './types'
import { ChattyClientBuilder } from './client_builder'
import { ChattyClientMessages } from './client_messages'
import { ChattyHostMessages } from './host_messages'
import 'es6-promise/auto' // Polyfill only browsers without Promises
import * as debugLib from 'debug'

/**
 * @private
 * Client connection status
 */

export enum ChattyClientStates {
  Connecting,
  Syn,
  Connected
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

  send (eventName: string, ...payload: any[]): void

  /**
   * Send a message to the host via a message channel, and then await a response. The event listener in
   * the host returns a value or a promise that is resolved at some later point.
   *
   * @param eventName The name of the event to send to the host
   * @param payload Additional data to send to host. Restricted to transferable objects, ownership of the
   * object will be transferred to the host.
   * @returns A Promise that will resolve when the host event handler returns. The promise will reject
   * if no response is received within [[ChattyClientBuilder.withDefaultTimeout]] milliseconds. The
   * response will be an array containing all responses from any registered event handlers on the host.
   */

  sendAndReceive (eventName: string, ...payload: any[]): Promise<any[]>
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
  private _targetOrigin: string
  private _state = ChattyClientStates.Connecting
  private _defaultTimeout: number
  private _sequence = 0
  private _receivers: {[key: number]: Receiver} = {}

  /**
   * @param builder The client builder that is responsible for constructing this object.
   * @hidden
   */

  constructor (builder: ChattyClientBuilder) {
    this._handlers = builder.handlers
    this._targetOrigin = builder.targetOrigin
    this._defaultTimeout = builder.defaultTimeout
    this._channel = new MessageChannel()
  }

  /**
   * @returns a Promise to an object that resolves when the host has acknowledged the connection.
   */

  get connection () {
    return this._connection
  }

  /**
   * @returns a flag indicating whether the client has successfully connected to the host.
   */

  get isConnected () {
    return this._state === ChattyClientStates.Connected
  }

  /**
   * Connects to the host window.
   * @returns a Promise to an object that resolves when the host has acknowledged the connection. The
   * object implements the [[ChattyClientConnection]] interface that can be used to talk to the host.
   */

  async connect (): Promise<ChattyClientConnection> {
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
                this.sendMsg(ChattyClientMessages.Message, { eventName, payload })
              },

              sendAndReceive: async (eventName: string, ...payload: any[]) => {
                const sequence = ++this._sequence
                this.sendMsg(ChattyClientMessages.MessageWithResponse, { eventName, payload }, sequence)
                return new Promise<any>((resolve, reject) => {
                  let timeoutId
                  if (this._defaultTimeout > -1) {
                    timeoutId = setTimeout(() => {
                      delete this._receivers[sequence]
                      reject(new Error('Timeout'))
                    }, this._defaultTimeout)
                  }
                  this._receivers[sequence] = { resolve, reject, timeoutId }
                })
              }

            })
            break
          case ChattyHostMessages.Message:
            if (this._handlers[evt.data.data.eventName]) {
              this._handlers[evt.data.data.eventName].forEach(fn => fn.apply(this, evt.data.data.payload))
            }
            break
          case ChattyHostMessages.MessageWithResponse:
            {
              const { eventName, payload, sequence } = evt.data.data
              let results = []
              if (this._handlers[eventName]) {
                results = this._handlers[eventName].map(
                  fn => fn.apply(this, payload)
                )
              }
              Promise.all(results)
                .then(resolvedResults => {
                  this.sendMsg(ChattyClientMessages.Response, { eventName, payload: resolvedResults }, sequence)
                })
                .catch(error => {
                  this.sendMsg(ChattyClientMessages.ResponseError, { eventName, payload: error }, sequence)
                })
            }
            break
          case ChattyHostMessages.Response:
            const receiver = this._receivers[evt.data.data.sequence]
            if (receiver) {
              delete this._receivers[evt.data.data.sequence]
              if (receiver.timeoutId) {
                clearTimeout(receiver.timeoutId)
              }
              receiver.resolve(evt.data.data.payload)
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
                receiver.reject(evt.data.data.payload)
              }
            }
            break
        }
      }

      this.initiateHandshake()
    })
    return this._connection
  }

  private initiateHandshake () {
    ChattyClient._debug('connecting to', this._targetOrigin)
    this._hostWindow.postMessage({
      action: ChattyClientMessages.Syn
    },
    this._targetOrigin,
    [this._channel.port2])
    this._state = ChattyClientStates.Syn
  }

  private sendMsg (action: ChattyClientMessages, data: any = {}, sequence?: number) {
    const sequenceData = sequence ? { sequence } : {}
    const dataWithSequence = { ...data, ...sequenceData }
    ChattyClient._debug('sending', action, dataWithSequence)
    this._channel.port1.postMessage({ action, data: dataWithSequence })
  }

}
