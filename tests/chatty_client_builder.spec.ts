/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

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

import { Chatty } from '../src/index'
import { ChattyClient } from '../src/client'

describe('ChattyClientBuilder', () => {
  it('should create an instance of the right type', () => {
    const client = Chatty.createClient().build()
    expect(client).toEqual(jasmine.any(ChattyClient))
  })

  it('should add an on<action> handler', () => {
    const dance = jasmine.createSpy('dance')
    const client = Chatty.createClient()

    client.on('party', dance)
    expect(client.handlers.party).toEqual([dance])
  })

  it('should add a second on<action> handler', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const client = Chatty.createClient()

    client.on('party', dance)
    client.on('party', pizza)
    expect(client.handlers.party).toEqual([dance, pizza])
  })

  it('should remove an on<action> handler with off', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const client = Chatty.createClient()

    client.on('party', dance)
    client.on('party', pizza)
    client.off('party', dance)
    expect(client.handlers.party).toEqual([pizza])
  })

  it('should not remove an on<action> handler with off if the method does not match', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const birthday = jasmine.createSpy('birthday')
    const client = Chatty.createClient()

    client.on('party', dance)
    client.on('party', pizza)
    client.off('party', birthday)
    expect(client.handlers.party).toEqual([dance, pizza])
  })

  it('should not remove an on<action> handler with off if the name does not match', () => {
    const dance = jasmine.createSpy('dance')
    const pizza = jasmine.createSpy('pizza')
    const client = Chatty.createClient()

    client.on('party', dance)
    client.on('party', pizza)
    client.off('off', dance)
    expect(client.handlers.party).toEqual([dance, pizza])
  })

  describe('defaultTimeout', () => {
    it('should default to 30 seconds', () => {
      const client = Chatty.createClient()
      expect(client.defaultTimeout).toEqual(30000)
    })

    it('should allow setting', () => {
      const client = Chatty.createClient().withDefaultTimeout(100)
      expect(client.defaultTimeout).toEqual(100)
    })
  })

  describe('targetOrigin', () => {
    it('should default to wildcard', () => {
      const client = Chatty.createClient()
      expect(client.targetOrigin).toEqual('*')
    })

    it('should allow setting', () => {
      const client = Chatty.createClient().withTargetOrigin(
        'https://example.com'
      )
      expect(client.targetOrigin).toEqual('https://example.com')
    })
  })
})
