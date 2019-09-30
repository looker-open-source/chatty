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

import { Chatty, ChattyHostConnection } from '../src/index'
import { Actions } from './constants'
import { Msg } from './types'

const doGetTitle = (client: ChattyHostConnection, id: number) => {
  client.sendAndReceive(Actions.GET_TITLE).then((payload: any[]) => {
    document.querySelector(`#got-title-${id}`)!.innerHTML = payload[0]
  }).catch(console.error)
}

const doGetTitleAsync = (client: ChattyHostConnection, id: string) => {
  client.sendAndReceiveAsync(Actions.GET_TITLE_ASYNC).then((payload: any[]) => {
    document.querySelector(`#got-title-${id}`)!.innerHTML = payload[0]
  }).catch(console.error)
}

const doGetErrorAsync = (client: ChattyHostConnection, id: string) => {
  client.sendAndReceiveAsync(Actions.GET_ERROR_ASYNC).then((payload: any[]) => {
    document.querySelector(`#got-title-${id}`)!.innerHTML = payload[0]
  }).catch(error => {
    document.querySelector(`#got-error-${id}`)!.innerHTML = 'error occured - see console'
    console.error('error occured', error)
  })
}

const bumpAndGet = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const el = document.querySelector('#host-counter')
      if (el) {
        let counter = parseInt(el.innerHTML, 10)
        counter += 1
        el.innerHTML = `${counter}`
        if (counter % 5 === 0) {
          reject('When counter divisible by 5 an error is thrown')
          return
        }
        resolve(counter)
      } else {
        reject('counter not found')
      }
    }, 250)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  Chatty.createHost('//localhost:8080/client.html')
    .appendTo(document.querySelector('#div-1') as HTMLElement)
    .on(Actions.SET_STATUS, (msg: Msg) => {
      const status: Element = document.querySelector('#host-status')!
      status.innerHTML = `${msg.status} 1`
    })
    .on(Actions.BUMP_AND_GET_COUNTER_ASYNC, (msg: Msg) => {
      return bumpAndGet()
    })
    .frameBorder('1')
    .withTargetOrigin(window.location.origin)
    .build()
    .connect()
    .then(client => {
      document.querySelector('#change-status')!.addEventListener('click', () => {
        client.send(Actions.SET_STATUS, { status: 'Message to client 1' })
      })
      document.querySelector('#get-title-1')!.addEventListener('click', () => doGetTitle(client, 1))
      document.querySelector('#get-title-1a')!.addEventListener('click', () => doGetTitleAsync(client, '1a'))
      document.querySelector('#get-error-1a')!.addEventListener('click', () => doGetErrorAsync(client, '1a'))
    })
    .catch(console.error)
  Chatty.createHost('//localhost:8080/client.html')
    .appendTo(document.querySelector('#div-2') as HTMLElement)
    .on(Actions.SET_STATUS, (msg: Msg) => {
      const status = document.querySelector('#host-status')!
      status.innerHTML = `${msg.status} 2`
    })
    .on(Actions.BUMP_AND_GET_COUNTER_ASYNC, (msg: Msg) => {
      return bumpAndGet()
    })
    .frameBorder('1')
    .withTargetOrigin(window.location.origin)
    .build()
    .connect()
    .then(client => {
      document.querySelector('#change-status')!.addEventListener('click', () => {
        client.send(Actions.SET_STATUS, { status: 'Message to client 2' })
      })
      document.querySelector('#get-title-2')!.addEventListener('click', () => doGetTitle(client, 2))
      document.querySelector('#get-title-2a')!.addEventListener('click', () => doGetTitleAsync(client, '2a'))
      document.querySelector('#get-error-2a')!.addEventListener('click', () => doGetErrorAsync(client, '2a'))
    })
    .catch(console.error)
})
