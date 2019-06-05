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
