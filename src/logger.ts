import { TransformFn, addContext } from './transforms'

const LogLevel = Symbol.for('level')

export type OutputFn = (obj: any) => any

interface PartialLoggerOptions<L extends string> {
  transforms?: TransformFn[]
  outputs?: OutputFn[]
  parent?: Logger<L>
  minLevel?: number | L
}

export interface LoggerOptions<L extends string> extends PartialLoggerOptions<L> {
  levels: readonly L[]
}

interface BoxedMsg {
  [LogLevel]: number
  [k: string]: any
}

type LogMethods<Levels extends string> = {
  [l in Levels]: (
    ((obj: {}, msg?: string, ...fmtArgs: any[]) => void) &
    ((msg: string, ...fmtArgs: any[]) => void)
  )
}

export type Logger<L extends string> =
  BaseLogger<L> &
  LogMethods<L>

export type LoggerConstructor<L extends string> =
  new(opts?: PartialLoggerOptions<L>) => Logger<L>

export abstract class BaseLogger<L extends string> {
  minLevel: number | undefined
  levels: readonly L[]
  outputs: undefined | OutputFn[] = []
  transforms: undefined | TransformFn[] = []
  parent: undefined | Logger<L>

  constructor(opts: LoggerOptions<L>) {
    this.levels = opts.levels

    if (typeof opts.minLevel === 'string') {
      const idx = this.levels.indexOf(opts.minLevel)
      if (idx === -1) {
        throw new Error('Unknown minimum level: ' + opts.minLevel)
      }
      this.minLevel = idx
    } else {
      this.minLevel = opts.minLevel
    }

    this.transforms = opts.transforms
    this.outputs = opts.outputs
    this.parent = opts.parent
  }

  addTransforms(...transforms: TransformFn[]): this {
    if (!this.transforms) {
      this.transforms = []
    }
    this.transforms.push(...transforms)
    return this
  }

  addOutputs(...outputs: OutputFn[]): this {
    if (!this.outputs) {
      this.outputs = []
    }
    this.outputs.push(...outputs)
    return this
  }

  log(sevNum: number | L, msg: string, ...fmt: any[]): void
  log(sevNum: number | L, obj: {}, msg?: string, ...fmt: any[]): void
  log(sevNum: number | L, objOrMsg: string | {}, ...rest: any[]): void {
    if (typeof sevNum === 'number') {
      if (this.levels[sevNum] === undefined) {
        throw new Error('Unknown log level: ' + sevNum)
      }
    } else {
      const num = this.levels.indexOf(sevNum)
      if (num === -1) {
        throw new Error('Unknown log level: ' + sevNum)
      }
      sevNum = num
    }

    if (this.minLevel !== undefined && sevNum > this.minLevel) {
      return
    }

    const boxedMsg: BoxedMsg = {
      [LogLevel]: sevNum,
      level: this.levels[sevNum],
    }
    if (typeof objOrMsg === 'object') {
      Object.assign(boxedMsg, objOrMsg)
      if (rest.length > 0) {
        if (rest.length === 1) {
          boxedMsg.msg = rest[0]
        } else {
          boxedMsg.msg = rest
        }
      }
    } else { /* string */
      if (rest.length > 0) {
        boxedMsg.msg = [objOrMsg, ...rest]
      } else {
        boxedMsg.msg = objOrMsg
      }
    }

    this._log(boxedMsg)
  }

  protected _log(msg: BoxedMsg): void {
    if (this.minLevel !== undefined && msg[LogLevel] > this.minLevel) {
      return
    }

    if (this.transforms) {
      for (const transform of this.transforms) {
        try {
          const result = transform(msg)
          if (result === false) {
            return
          } else if (result !== undefined) {
            if (typeof (result as any)[LogLevel] === 'number') {
              msg = result as any
            } else {
              msg = { ...result, [LogLevel]: msg[LogLevel] }
            }
          }
        } catch(e) {
          /* noop */
        }
      }
    }

    if (this.outputs) {
      for (const output of this.outputs) {
        try {
          output(msg)
        } catch(e) {
          /* noop */
        }
      }
    }

    if (this.parent) {
      this.parent._log(msg)
    }
  }

  withContext(ctx: ({} | (() => {}))): Logger<L> {
    return this.child().addTransforms(addContext(ctx))
  }

  abstract child(): Logger<L>
}

export function makeLoggerClass<L extends string>(levels: readonly L[]): LoggerConstructor<L>
{
  const loggerClass = class CustomLogger extends BaseLogger<L> {
    constructor(loggerOptions?: PartialLoggerOptions<L>) {
      super({ levels, ...loggerOptions })
    }

    child(this: Logger<L>): Logger<L> {
      return new loggerClass({
        parent: this
      })
    }
  } as LoggerConstructor<L>
  
  for (let i = 0; i < levels.length; ++i) {
    loggerClass.prototype[levels[i]] = function (): void {
      this.log.call(i, ...arguments)
    }
  }

  return loggerClass
}

export function makeLogger<L extends string>(opts: LoggerOptions<L>): Logger<L> {
  const cls = makeLoggerClass(opts.levels)
  return new cls(opts)
}