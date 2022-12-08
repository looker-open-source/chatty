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

/**
 * Defines a general purpose callback method used to respond to events.
 */

export type Callback = (...args: any[]) => any

/**
 * A container for [[Callback]] methods indexed by event name.
 */

export interface CallbackStore {
  [name: string]: Callback[]
}

/**
 * A container for [[AbortController]] instances indexed by event name. and sequence
 */

export interface AbortControllerStore {
  [nameSequence: string]: AbortController
}

/**
 * Options associated with a sendReceive request
 */

export interface Options {
  /**
   * Abort signal used to abort a request. If the signal is present
   * the sendReceive request will never timeout.
   */

  signal: AbortSignal

  /**
   * Propogate signal used to propagate a signal abort to the message
   * receiver.
   */
  propagateSignal?: boolean
}

/**
 * A container for generic methods
 *
 * @deprecated Replaced by [[ChattyHostConnection]] and [[ChattyClientConnection]]
 */

export interface MethodStore {
  [name: string]: (...args: any[]) => any
}

export interface Receiver {
  resolve: (value?: any) => void
  reject: (value?: any) => void
  timeoutId: any
}
