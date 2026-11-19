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

declare const process: { env?: Record<string, string | undefined> } | undefined

export interface Debugger {
  (...args: any[]): void
  readonly namespace: string
  readonly enabled: boolean
}

let rawConfig: string | undefined
let cache: [string, RegExp[], RegExp[]] | undefined
const enabledCache = new Map<string, boolean>()

export const resetCache = (): void => {
  rawConfig = undefined
  cache = undefined
  enabledCache.clear()
}

const toRegex = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`
  )

const getRawConfig = (): string => {
  if (rawConfig !== undefined) return rawConfig
  try {
    const stored =
      typeof window !== 'undefined' &&
      window.localStorage &&
      window.localStorage.getItem('debug')
    if (typeof stored === 'string') {
      rawConfig = stored
      return stored
    }
  } catch {
    // Ignore storage SecurityError in sandboxed iframes
  }
  try {
    rawConfig = (typeof process !== 'undefined' && process?.env?.DEBUG) || ''
    return rawConfig
  } catch {
    rawConfig = ''
    return ''
  }
}

export const isDebugEnabled = (namespace: string): boolean => {
  const cachedResult = enabledCache.get(namespace)
  if (cachedResult !== undefined) return cachedResult

  const raw = getRawConfig()
  if (!raw) {
    if (enabledCache.size >= 256) enabledCache.clear()
    enabledCache.set(namespace, false)
    return false
  }
  if (!cache || cache[0] !== raw) {
    const names: RegExp[] = []
    const skips: RegExp[] = []
    for (const token of raw.split(/[\s,]+/)) {
      if (!token) continue
      if (token[0] === '-') {
        if (token.length > 1) skips.push(toRegex(token.slice(1)))
      } else {
        names.push(toRegex(token))
      }
    }
    cache = [raw, names, skips]
  }
  const enabled =
    !cache[2].some((re) => re.test(namespace)) &&
    cache[1].some((re) => re.test(namespace))
  if (enabledCache.size >= 256) enabledCache.clear()
  enabledCache.set(namespace, enabled)
  return enabled
}

const UNITS: Array<[number, string]> = [
  [86400000, 'd'],
  [3600000, 'h'],
  [60000, 'm'],
  [1000, 's'],
]

const formatDuration = (ms: number): string => {
  for (const [unit, suffix] of UNITS) {
    if (ms >= unit) return `${Math.round(ms / unit)}${suffix}`
  }
  return `${ms}ms`
}

export const createDebug = (namespace: string): Debugger => {
  let prevTime: number | undefined

  const debugFn = (...args: any[]): void => {
    if (!isDebugEnabled(namespace)) return

    const now = Date.now()
    const diffLabel = `+${formatDuration(now - (prevTime ?? now))}`
    prevTime = now

    if (args.length === 0) {
      console.info(`${namespace} ${diffLabel}`)
      return
    }

    const out = args.slice()
    if (typeof out[0] === 'string') {
      out[0] = `${namespace} ${out[0]}`
    } else {
      out.unshift(namespace)
    }
    out.push(diffLabel)
    console.info(...out)
  }

  Object.defineProperties(debugFn, {
    enabled: { enumerable: true, get: () => isDebugEnabled(namespace) },
    namespace: { enumerable: true, value: namespace },
  })

  return debugFn as Debugger
}
