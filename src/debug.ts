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

const toRegex = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`
  )

const getRawConfig = (): string => {
  try {
    const stored =
      typeof window !== 'undefined' &&
      window.localStorage &&
      window.localStorage.getItem('debug')
    if (typeof stored === 'string') return stored
  } catch {
    // Ignore storage SecurityError in sandboxed iframes
  }
  try {
    return (typeof process !== 'undefined' && process?.env?.DEBUG) || ''
  } catch {
    return ''
  }
}

export const isDebugEnabled = (namespace: string): boolean => {
  const raw = getRawConfig()
  if (!raw) return false
  let matched = false
  for (const token of raw.split(/[\s,]+/)) {
    if (!token) continue
    if (token[0] === '-') {
      if (token.length > 1 && toRegex(token.slice(1)).test(namespace)) {
        return false
      }
    } else if (!matched && toRegex(token).test(namespace)) {
      matched = true
    }
  }
  return matched
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
  // Evaluate once at logger creation (matching debug@2) so disabled calls are a zero-cost no-op.
  const enabled = isDebugEnabled(namespace)
  let prevTime: number | undefined

  const debugFn = enabled
    ? (...args: any[]): void => {
        const now = Date.now()
        const diffLabel = `+${formatDuration(now - (prevTime ?? now))}`
        prevTime = now

        const out = args.slice()
        if (typeof out[0] === 'string') {
          out[0] = `${namespace} ${out[0]}`
        } else {
          out.unshift(namespace)
        }
        out.push(diffLabel)
        // package.json eslintConfig "no-console" allows info/warn/error (disallows console.log).
        console.info(...out)
      }
    : (): void => {
        // Disabled namespace no-op
      }

  Object.defineProperties(debugFn, {
    enabled: { enumerable: true, value: enabled },
    namespace: { enumerable: true, value: namespace },
  })

  return debugFn as Debugger
}
