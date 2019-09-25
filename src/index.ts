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

import { ChattyClientBuilder } from './client_builder'
import { ChattyHostBuilder } from './host_builder'

export { ChattyClientBuilder } from './client_builder'
export { ChattyHostBuilder } from './host_builder'

export { ChattyClient, ChattyClientConnection } from './client'
export { ChattyHost, ChattyHostConnection } from './host'

export * from './types'

/**
 * @class Chatty
 *
 * Primary interface for chatty. Provides methods for creating the chatty hosts and clients.
 */
export class Chatty {
  /**
   * Creates a [[ChattyHostBuilder]] object. The builder presents a set of methods to configure
   * and construct the host object.
   *
   * It is up to the client's webserver to return the correct headers to allow for parent/iframe
   * communication. See
   * [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
   * for details.
   *
   * @param url The URL of the client iframe to create. The hosted iframe should create a chatty
   * client to communicate with the host.
   */
  static createHost (url: string) {
    return new ChattyHostBuilder(url)
  }

  /**
   * Creates a [[ChattyHostBuilder]] object. The builder presents a set of methods to configure
   * and construct the host object.
   *
   * @param source The source of the client iframe to create. The hosted iframe should create a chatty
   * client to communicate with the host.
   */

  static createHostFromSource (source?: string) {
    return new ChattyHostBuilder(undefined, source)
  }

  /**
   * Creates a [[ChattyClientBuilder]] object. The builder presents a set of methods to configure
   * and construct the client object.
   */

  static createClient () {
    return new ChattyClientBuilder()
  }
}
