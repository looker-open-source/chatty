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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Callback, CallbackStore } from './types'
import { ChattyClient } from './client'

/**
 * Provides methods to define the properties of a [[ChattyClient]]
 */

export class ChattyClientBuilder {
  private _targetOrigin = '*'
  private _handlers: CallbackStore = {}
  private _defaultTimeout = 30000

  get targetOrigin () {
    return this._targetOrigin
  }

  get handlers () {
    return this._handlers
  }

  get defaultTimeout () {
    return this._defaultTimeout
  }

  /**
   * Removes an event handler to the client.
   *
   * @param name Event name
   * @param fn Callback function to remove
   * @returns the client builder
   */

  off (name: string, fn: Callback) {
    if (this._handlers[name]) {
      this._handlers[name] = this._handlers[name].filter((handler) => handler !== fn)
    }
  }

  /**
   * Adds an event handler to the client.
   *
   * @param name Event name to which to listen.
   * @param fn Callback function that is invoked when the event
   * is received, and accepts any parameters that were passed with the event.
   * If the event received is sent using [[ChattyHostConnection.sendAndReceive]], its return value is
   * included in the array that will be passed to the resolved promise.
   * @returns the client builder
   */

  on (name: string, fn: Callback) {
    this._handlers[name] = this._handlers[name] || []
    this._handlers[name].push(fn)
    return this
  }

  /**
   * Sets the default period of time a [[ChattyClientConnection.sendAndReceive]] or
   * [[ChattyClientConnection.sendAndReceiveAsync]]message will wait. Use a negative
   * number to wait indefinitely.
   * The default is 30000ms
   *
   * @param timeout in milliseconds
   * @returns the client builder
   */

  withDefaultTimeout (timeout: number) {
    this._defaultTimeout = timeout
    return this
  }

  /**
   * Optional. Sets the target origin parameter used to communicate with the host. Default
   * is '*'. If possible it should be set the the host window's origin.
   *
   * @param targetOrigin targetOrigin to use with postMessage()
   * @returns the client builder
   */

  withTargetOrigin (targetOrigin: string) {
    this._targetOrigin = targetOrigin
    return this
  }

  /**
   * Builds a [[ChattyClient]] with the provided properties.
   * @returns a new Chatty client.
   */

  build () {
    return new ChattyClient(this)
  }
}
