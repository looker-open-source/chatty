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

    it('should post message with data and a sequence', function () {
      client = Chatty.createClient().build()
      action = ChattyClientMessages.Message
      spyOn(client._channel.port1, 'postMessage')
      client.sendMsg(action, data, 1)
      expect(client._channel.port1.postMessage).toHaveBeenCalledWith({
        action: action,
        data: { ...data, sequence: 1 }
      })
    })
  })

  describe('connect', function () {

    describe('message event listener', function () {

      describe('client receives SynAck', function () {
        beforeEach(() => {
          client = Chatty.createClient().withDefaultTimeout(100).build()
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
          connecting.then((connection) => {
            connection.send(eventName, payload)
            expect(client.sendMsg.calls.argsFor(1)[0]).toEqual(ChattyClientMessages.Message)
            expect(client.sendMsg.calls.argsFor(1)[1]).toEqual({ eventName, payload: [payload] })
            done()
          }).catch(console.error)
        })

        it('sendAndReceive function sends a message and returns a promise that resolves on response', function (done) {
          connecting.then((connection) => {
            connection.sendAndReceive(eventName, payload)
              .then((data) => {
                expect(data[0]).toEqual({ message: 'Hello' })
                done()
              })
              .catch(console.error)
            expect(client.sendMsg.calls.argsFor(1)[0]).toEqual(ChattyClientMessages.MessageWithResponse)
            expect(client.sendMsg.calls.argsFor(1)[1]).toEqual({ eventName, payload: [payload] })
            expect(client.sendMsg.calls.argsFor(1)[2]).toEqual(jasmine.any(Number))
            const sequence = client.sendMsg.calls.argsFor(1)[2]
            client._channel.port2.postMessage({
              action: ChattyHostMessages.Response,
              data: { sequence, eventName, payload: [{ message: 'Hello' }] }
            })
          }).catch(console.error)
        })

        it('sendAndReceive ignores invalid sequence values', function (done) {
          connecting.then((connection) => {
            connection.sendAndReceive(eventName, payload)
              .then(() => void 0)
              .catch(done)
            expect(client.sendMsg.calls.argsFor(1)[0]).toEqual(ChattyClientMessages.MessageWithResponse)
            expect(client.sendMsg.calls.argsFor(1)[1]).toEqual({ eventName, payload: [payload] })
            expect(client.sendMsg.calls.argsFor(1)[2]).toEqual(jasmine.any(Number))
            const sequence = client.sendMsg.calls.argsFor(1)[2] + 100
            client._channel.port2.postMessage({
              action: ChattyHostMessages.Response,
              data: { sequence, eventName, payload: [{ message: 'Hello' }] }
            })
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

      describe('client receives MessageWithResponse', function () {
        beforeEach(() => {
          dance = jasmine.createSpy('dance').and.returnValue({ lit: true })
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
              action: ChattyHostMessages.MessageWithResponse,
              data: {
                eventName: 'party',
                payload: {
                  status: 'lit'
                },
                sequence: 1
              }
            })

            setTimeout(() => {
              expect(dance).toHaveBeenCalled()
              expect(client.sendMsg).toHaveBeenCalledWith(
                ChattyClientMessages.Response,
                { eventName: 'party', payload: [{ lit: true }] },
                1)
              done()
            })
          }).catch(console.error)
        })

        it('should ignore unknown events', function (done) {
          connecting.then(() => {
            client._channel.port2.postMessage({
              action: ChattyHostMessages.MessageWithResponse,
              data: {
                eventName: 'school'
              }
            })

            setTimeout(() => {
              expect(dance).not.toHaveBeenCalled()
              expect(client.sendMsg).not.toHaveBeenCalledWith(
                ChattyClientMessages.Response,
                { eventName: 'party', payload: [{ lit: true }] },
                1)
              done()
            })
          }).catch(console.error)
        })
      })
    })
  })
})
