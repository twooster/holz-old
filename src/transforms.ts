import { format } from 'util'

export type TransformFn = (obj: any) => (void | false | {})

export function composeTransforms(...fns: Array<TransformFn>): TransformFn {
  return (v: any): any => {
    for (const fn of fns) {
      const result = fn(v)
      if (result === false) {
        return false
      } else if (result !== undefined) {
        v = result
      }
    }
  }
}

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

export const tag: TransformFn = function tag(tag: string): TransformFn {
  return (msg: any) => {
    if (typeof msg === 'object') {
      if (msg.tags === undefined) {
        msg.tags = []
      } else if (!Array.isArray(msg.tags)) {
        return
      }
      msg.tags.push(tag)
    }
  }
}
