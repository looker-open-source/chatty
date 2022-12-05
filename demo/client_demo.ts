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
import { Actions } from './constants'
import type { Msg } from './types'

document.addEventListener('DOMContentLoaded', () => {
  Chatty.createClient()
    .on(Actions.SET_STATUS, (msg: Msg) => {
      const status = document.querySelector('#client-status')!
      status.innerHTML = msg.status
    })
    .on(Actions.GET_TITLE, (msg: Msg) => {
      return document.querySelector('title')!.innerText
    })
    .on(Actions.GET_TITLE_ASYNC, (msg: Msg) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(document.querySelector('title')!.innerText)
        }, 200)
      })
    })
    .on(Actions.GET_ERROR_ASYNC, (msg: Msg) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("I've fallen and I can't get up!"))
        }, 200)
      })
    })
    .withTargetOrigin(window.location.origin)
    .build()
    .connect()
    .then((host) => {
      document
        .querySelector('#change-status')!
        .addEventListener('click', () => {
          host.send(Actions.SET_STATUS, { status: 'click from client' })
        })
      document
        .querySelector('#bump-host-counter')!
        .addEventListener('click', () => {
          host
            .sendAndReceive(Actions.BUMP_AND_GET_COUNTER_ASYNC)
            .then((payload: any[]) => {
              document.querySelector('#host-counter')!.innerHTML = payload[0]
            })
            .catch((error: any) => {
              document.querySelector('#host-counter')!.innerHTML = error
            })
        })
      document.querySelector('#do-abort')!.addEventListener('click', () => {
        const abortController = new AbortController()
        setTimeout(() => {
          abortController.abort()
        }, 150)
        host
          .sendAndReceive(Actions.BUMP_AND_GET_COUNTER_ASYNC, {
            signal: abortController.signal,
          })
          .then((payload: any[]) => {
            document.querySelector('#got-abort')!.innerHTML = payload[0]
          })
          .catch((error: any) => {
            document.querySelector('#got-abort')!.innerHTML = error
          })
      })
    })
    .catch(console.error)
})
