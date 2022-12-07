# chatty

A simple web browser [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
host/client channel message manager. It uses
[MessageChannels](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel)
to avoid cross-talk between multiple iframes. It allows configuring the iframe to run in sandboxed mode.

## Basic use

A user first initiates the creation of a client iframe using the `createHost(url)` method, adding event
handlers using `on(eventName, data)`. They then creates the iframe using `build()`, and opens
a communication channel using `connect()`. Once the channel opens, the user can send messages to
the client with `send(eventName, data)`

```typescript
import { Chatty } from 'chatty'

Chatty.createHost('//example.com/client.html')
  .on(Actions.SET_STATUS, (msg: Msg) => {
    const status: Element = document.querySelector('#host-status')!
    status.innerHTML = `${msg.status} 1`
  })
  .build()
  .connect()
  .then((client) => {
    document.querySelector('#change-status')!.addEventListener('click', () => {
      client.send(Actions.SET_STATUS, { status: 'Message to client 1' })
    })
  })
  .catch(console.error)
```

The client iframe can also be created using source from the `createHostFromSource(source)` method.

```typescript
import { Chatty } from 'chatty'

Chatty.createHostFromSource(`
      <html>
        <body>
          <script src='//example.com/client.js' type="application/javascript" />
        </body>
      </html>
  `)
```

The client `iframe` creates its client using `createClient()`. It also adds event listeners, builds the
client and connects. Once connected, it can send messages to its host.

```typescript
import { Chatty } from 'chatty'

Chatty.createClient()
  .on(Actions.SET_STATUS, (msg: Msg) => {
    const status = document.querySelector('#client-status')!
    status.innerHTML = msg.status
  })
  .build()
  .connect()
  .then((host) => {
    document.querySelector('#change-status')!.addEventListener('click', () => {
      host.send(Actions.SET_STATUS, { status: 'click from client' })
    })
  })
  .catch(console.error)
```

## Sending and receiving

Both the host and the client can send a message and wait for a response. The `sendAndReceive()` method
returns a promise that is resolved with a values returned by the event listeners on the client or host.

For example, a host can request that the client return its title.

```typescript
import { Chatty } from 'chatty'

Chatty.createHost('//example.com/client.html')
  .build()
  .connect()
  .then((client) => {
    document.querySelector('#get-title')!.addEventListener('click', () => {
      client.sendAndReceive(Actions.GET_TITLE).then((payload: any[]) => {
        const title: Element = document.querySelector('#got-title')!
        title.innerHTML = payload[0]
      })
    })
  })
  .catch(console.error)
```

The client simply returns the text value of its title in the event handler.

```typescript
import { Chatty } from 'chatty'

Chatty.createClient()
  .on(Actions.GET_TITLE, () => {
    return document.querySelector('title')!.text
  })
  .build()
  .connect()
  .catch(console.error)
```

The results provided by the promise are an array because their may be multiple handlers for a given event. If there are no event handlers for a given action the array will be empty.

## Sending and receiving asynchronous responses

The `sendAndReceive` method can also be used for data that needs to be retrieved asynchronously. In this scenario
the target function must return a Promise.

In the following example, the host requests that the client return some data that is to be retrieved asynchronously.

```typescript
import { Chatty } from 'chatty'

Chatty.createHost('//example.com/client.html')
  .build()
  .connect()
  .then((client) => {
    document.querySelector('#get-title')!.addEventListener('click', () => {
      client.sendAndReceive(Actions.GET_TITLE).then((payload: any[]) => {
        const title: Element = document.querySelector('#got-title')!
        title.innerHTML = payload[0]
      })
    })
  })
  .catch(console.error)
```

The client message handler returns a `Promise`.

```typescript
import { Chatty } from 'chatty'

Chatty.createClient()
  .on(Actions.GET_TITLE, () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(document.querySelector('title')!.text)
      }, 200)
    })
  })
  .build()
  .connect()
  .catch(console.error)
```

## Sending and receiving timeouts

By default, `sendAndReceive` will timeout and throw an Error if a response is not received within the
time specifed by the builder `withDefaultTimeout` method which defaults to 30 seconds. `sendAndReceive`
will NOT timeout if `withDefaultTimeout` is set to a negative number. Alternatively an `AbortSignal`
can be added to an `Options` object passed as the last argument of the `sendAndReceive` call. In this
scenario the default timeout is ignored. The caller may then use the `AbortController` to terminate the
`sendAndReceive` call.

In following example, the error message will be displayed in the title because the timeout that fires the
abort will trigger before the timeout that returns the title.

```typescript
import { Chatty } from 'chatty'

const abortController = new AbortController()
setTimeout(() => {
  abortController.abort()
}, 100)
Chatty.createHost('//example.com/client.html')
  .build()
  .connect()
  .then((client) => {
    document.querySelector('#get-title')!.addEventListener('click', () => {
      client
        .sendAndReceive(Actions.GET_TITLE, { signal: abortController.signal })
        .then((payload: any[]) => {
          const title: Element = document.querySelector('#got-title')!
          title.innerHTML = payload[0]
        })
        .catch((error: Error) => {
          const title: Element = document.querySelector('#got-title')!
          title.innerHTML = error.message
        })
    })
  })
  .catch(console.error)
```

The client message handler returns a `Promise` but its response will be
ignored as the request will be aborted before the timer triggers.

```typescript
import { Chatty } from 'chatty'

Chatty.createClient()
  .on(Actions.GET_TITLE, () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(document.querySelector('title')!.text)
      }, 200)
    })
  })
  .build()
  .connect()
  .catch(console.error)
```

## Sending and receiving abort propagation

By default, if a signal is provided to `sendAndReceive` and it is aborted, the signal is NOT
propagated to the message receiver. This behavior can be changed by setting `propagateSignal`
to true in the `Options` object. When set, the target handler will receive an `AbortSignal`
as the last argument of the handler.

This example demonstrates the use of `propagateSignal`.

```typescript
const abortController = new AbortController()
setTimeout(() => {
  abortController.abort('100ms timeout')
}, 100)
client
  .sendAndReceive(
    Actions.PROPAGATED_ABORT_SIGNAL,
    { status: 'This message should not be displayed' },
    {
      signal: abortController.signal,
      propagateSignal: true,
    }
  )
  .then((payload: any[]) => {
    document.querySelector(`#got-propagate-abort-${id}`)!.innerHTML = payload[0]
  })
  .catch((error) => {
    document.querySelector(`#got-propagate-abort-${id}`)!.innerHTML =
      'error occured - see console'
    console.error('error occured', error)
  })
```

Notice how the message receiver clears the timer if an `AbortSignal` is received.

```typescript
Chatty.createClient()
  .on(Actions.PROPAGATED_ABORT_SIGNAL, (msg: Msg, signal: AbortSignal) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const status = document.querySelector('#client-status')!
        status.innerHTML = msg.status
        resolve(status.innerHTML)
      }, 200)
      signal.addEventListener('abort', (event) => {
        clearTimeout(timeoutId)
        const status = document.querySelector('#client-status')!
        status.innerHTML = `Request aborted ${
          (event.target as AbortSignal).reason
        }`
      })
    })
  })
  .build()
  .connect()
  .catch(console.error)
```

## Getting Started

1. Make sure you have node and npm versions installed per `package.json`'s "engines" field.
2. `npm install`
3. `npm test`
4. `npm start`
5. Happy hacking!

## Repository Layout

- `/src` - This is where you should do all the work on Chatty.
- `/lib` - This is the built output generated by running `npm run build`. No editing should be done here.
- `/demo` - This is what is hosted by WebpackDevServer via `npm start`. Use this to build a demo and test Chatty in real time (no need to refresh the page manually or restart the dev server, it does that for you).

## NPM Commands

- `npm run build` - runs the Typescript compiler, outputting all generated source files to `/lib`. Run this when creating a new build to distribute on github.
- `npm run lint` - runs the ts linter
- `npm run lint-fix` - runs the ts linter and attempts to auto fix problems
- `npm start` - starts a dev server mounted on `/demo`.
- `npm test` - runs the test suite for Chatty.
