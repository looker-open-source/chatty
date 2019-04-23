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
import { ChattyClientMessages } from '../src/client_messages'
import { ChattyHostMessages } from '../src/host_messages'
import { ChattyClientConnection, ChattyClientStates } from '../src/client'
let eventName: string
let payload: any
let client: any // Allows spying on private members
let connecting: Promise<ChattyClientConnection>
let action: ChattyClientMessages
let data: any
let dance

describe('ChattyClient', function () {
  beforeEach(() => {
    eventName = 'EVENT'
    payload = 'payload'
    data = {}
  })

  describe('initiateHandshake', function () {
    it('should send msg and channel port', function () {
      client = Chatty.createClient().build()
      expect(client._state).toEqual(ChattyClientStates.Connecting)
      spyOn(client._hostWindow, 'postMessage')
      client.initiateHandshake()
      expect(client._hostWindow.postMessage).toHaveBeenCalledWith(
        {
          action: ChattyClientMessages.Syn
        }, '*', [client._channel.port2]
      )
      expect(client.isConnected).toEqual(false)
      expect(client._state).toEqual(ChattyClientStates.Syn)
    })

    it('should use a specified targetOrigin', function () {
      client = Chatty.createClient().withTargetOrigin('https://example.com').build()
      spyOn(client._hostWindow, 'postMessage')
      client.initiateHandshake()
      expect(client._hostWindow.postMessage).toHaveBeenCalledWith(
        {
          action: ChattyClientMessages.Syn
        }, 'https://example.com', [client._channel.port2]
      )
      expect(client.isConnected).toEqual(false)
      expect(client._state).toEqual(ChattyClientStates.Syn)
    })
  })

  describe('sendMsg', function () {
    it('should post message', function () {
      client = Chatty.createClient().build()
      action = ChattyClientMessages.Message
      spyOn(client._channel.port1, 'postMessage')
      client.sendMsg(action)
      expect(client._channel.port1.postMessage).toHaveBeenCalledWith({
        action: action,
        data: {}
      })
    })

    it('should post message with data', function () {
      client = Chatty.createClient().build()
      action = ChattyClientMessages.Message
      spyOn(client._channel.port1, 'postMessage')
      client.sendMsg(action, data)
      expect(client._channel.port1.postMessage).toHaveBeenCalledWith({
        action: action,
        data: data
      })
    })
  })

  describe('connect', function () {

    describe('message event listener', function () {

      describe('client receives SynAck', function () {
        beforeEach(() => {
          client = Chatty.createClient().build()
          spyOn(client, 'sendMsg')
          spyOn(client, 'initiateHandshake')
          connecting = client.connect()
          client._channel.port2.postMessage({
            action: ChattyHostMessages.SynAck
          })
        })

        it('should sendMsg', function (done) {
          connecting.then(() => {
            expect(client.sendMsg).toHaveBeenCalledWith(ChattyClientMessages.Ack)
            expect(client.isConnected).toEqual(true)
            expect(client._state).toEqual(ChattyClientStates.Connected)
            done()
          }).catch(console.error)
        })

        it('should resolve with a host whose send function sends a message to the host', function (done) {
          connecting.then((host) => {
            host.send(eventName, payload)
            expect(client.sendMsg.calls.argsFor(1)[0]).toEqual(ChattyClientMessages.Message)
            expect(client.sendMsg.calls.argsFor(1)[1]).toEqual({ eventName: eventName, payload: [payload] })
            done()
          }).catch(console.error)
        })

        it('should initiate handshake', function (done) {
          connecting.then(() => {
            expect(client.initiateHandshake).toHaveBeenCalled()
            done()
          }).catch(console.error)
        })

        it('should only connect once', (done) => {
          expect(client.connection).not.toBe(null)
          client.connect().then(() => {
            expect(client.initiateHandshake.calls.count()).toBe(1)
            done()
          })
        })
      })

      describe('client receives Message', function () {
        beforeEach(() => {
          dance = jasmine.createSpy('dance')
          client = Chatty.createClient()
            .on('party', dance)
            .build()

          spyOn(client, 'initiateHandshake')
          spyOn(client, 'sendMsg')

          connecting = client.connect()
          client._channel.port2.postMessage({
            action: ChattyHostMessages.SynAck
          })
        })

        it('should apply the correct event handler', function (done) {
          connecting.then(() => {
            client._channel.port2.postMessage({
              action: ChattyHostMessages.Message,
              data: {
                eventName: 'party',
                payload: { status: 'lit' }
              }
            })

            setTimeout(() => {
              expect(dance).toHaveBeenCalled()
              done()
            })
          }).catch(console.error)
        })

        it('should ignore unknown events', function (done) {
          connecting.then(() => {
            client._channel.port2.postMessage({
              action: ChattyHostMessages.Message,
              data: {
                eventName: 'school'
              }
            })

            setTimeout(() => {
              expect(dance).not.toHaveBeenCalled()
              done()
            })
          }).catch(console.error)
        })
      })
    })
  })
})
