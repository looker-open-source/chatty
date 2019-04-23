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

import { Chatty } from '../src/index'
import { ChattyHost } from '../src/host'
const url = '/base/tests/test.html'

describe('ChattyHostBuilder', () => {
  const dance = jasmine.createSpy('dance')

  it('should build an instance of the right type', () => {
    const host = Chatty.createHost(url)
      .build()
    expect(host).toEqual(jasmine.any(ChattyHost))
  })

  it('should add an HTMLElement to appendTo', () => {
    const element = document.body
    const host = Chatty.createHost(url)
      .appendTo(element)
    expect(host.el).toEqual(element)
  })

  it('should add an on<action> handler', () => {
    const host = Chatty.createHost(url)

    host.on('party', dance)
    expect(host.handlers.party).toEqual([dance])
  })

  it('should add a second on<action> handler', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const host = Chatty.createHost(url)

    host.on('party', dance)
    host.on('party', pizza)
    expect(host.handlers.party).toEqual([dance, pizza])
  })

  it('should remove an on<action> handler with off', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const host = Chatty.createHost(url)

    host.on('party', dance)
    host.on('party', pizza)
    host.off('party', dance)
    expect(host.handlers.party).toEqual([pizza])
  })

  it('should not remove an on<action> handler with off if the method does not match', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const birthday = jasmine.createSpy('birthday')
    const host = Chatty.createHost(url)

    host.on('party', dance)
    host.on('party', pizza)
    host.off('party', birthday)
    expect(host.handlers.party).toEqual([dance, pizza])
  })

  it('should add a sandbox attribute', () => {
    const host = Chatty.createHost(url)
      .sandbox('allow-scripts')
    expect(host.sandboxAttrs).toContain('allow-scripts')
  })

  it('should set frame border', () => {
    const host = Chatty.createHost(url)
      .frameBorder('1')
    expect(host.getFrameBorder()).toEqual('1')
  })

  it('should set target origin', () => {
    const host = Chatty.createHost(url)
      .withTargetOrigin('*')
    expect(host.targetOrigin).toEqual('*')
  })

  it('should apply multiple values', () => {
    const element = document.body
    const host = Chatty.createHost(url)
      .on('party', dance)
      .sandbox('allow-scripts')
      .frameBorder('1')
      .withTargetOrigin('*')
      .appendTo(element)
    expect(host.handlers.party).toEqual([dance])
    expect(host.sandboxAttrs).toContain('allow-scripts')
    expect(host.getFrameBorder()).toEqual('1')
    expect(host.targetOrigin).toEqual('*')
    expect(host.el).toEqual(element)
  })
})
