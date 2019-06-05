import { format } from 'util'

export type TransformFn = (obj: any) => (void | false | {})

export function addContext(ctx: {} | (() => {})): TransformFn {
  if (typeof ctx === 'function') {
    return (v: {}): any => {
      Object.assign(v, ctx())
    }
  }
  return (v: {}): any => {
    Object.assign(v, ctx)
  }
}

export const splat: TransformFn = function splat(msg: any) {
  if (typeof msg === 'object' && Array.isArray(msg.msg) && msg.msg.length > 0) {
    msg.msg = format(...msg.msg as [any, ...any[]])
  }
}

export function append(key: string, value: any): TransformFn {
  return (msg: any) => {
    if (typeof msg === 'object' && msg !== null) {
      if (msg[key] === undefined) {
        msg.key = []
      } else if (Array.isArray(msg[key])) {
        msg[key].push(value)
      }
    }
  }
}

export function prepend(key: string, value: any): TransformFn {
  return (msg: any) => {
    if (typeof msg === 'object' && msg !== null) {
      if (msg[key] === undefined) {
        msg.key = []
      } else if (Array.isArray(msg[key])) {
        msg[key].unshift(value)
      }
    }
  }
}

function buildFullErrorStack(err: { [k: string]: any }): string {
    let ret: string = String(err.stack)
    while(true) {
        if (err.cause && typeof err.cause === 'function') {
            try {
                err = err.cause()
                if (typeof err !== 'object' || err === null || !err.stack) {
                    break
                }
            } catch(e) {
                break
            }
        } else {
            break
        }
        ret += '\nCaused by: ' + String(err.stack)
    }
    return ret
}

export const serializeErrors: TransformFn = function serializeErrors(err: any): any {
    if (typeof err !== 'object' || err === null || !err.stack) {
        return err
    }
    const ret: any = {
      stack: buildFullErrorStack(err)
    }
    if (err.message !== undefined) ret.message = err.message
    if (err.name !== undefined) ret.name = err.name
    if (err.code !== undefined) ret.code = err.code
    if (err.signal !== undefined) ret.signal = err.signal
    return ret
}
