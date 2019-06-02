import { TransformFn, addContext } from './transforms'

const LogLevel = Symbol.for('level')

export type OutputFn = (obj: any) => any

export interface LoggerOptions {
  minLevel?: number | string,
  transforms?: TransformFn[]
  outputs?: OutputFn[]
  parent?: BaseLogger,
}

interface LoggerOptionsWithLevels extends LoggerOptions {
  levels: readonly string[]
}

interface BaseLoggerOptions extends LoggerOptionsWithLevels {
  cls: typeof BaseLogger
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
  TypedLogger<L> &
  LogMethods<L>

interface TypedLogger<L extends string> extends BaseLogger {
  minLevel: number | undefined
  levels: readonly L[]
  parent: Logger<L>
  subLogger(name: string): Logger<L>
  withContext(ctx: ({} | (() => {}))): Logger<L>
}

export class BaseLogger {
  subLoggers: Map<string, BaseLogger> | undefined
  minLevel: number | undefined
  levels: readonly string[]
  outputs: undefined | OutputFn[] = []
  transforms: undefined | TransformFn[] = []
  parent: undefined | BaseLogger
  cls: any

  constructor(opts: BaseLoggerOptions) {
    this.cls = opts.cls
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

  log(sevNum: number, msg: string, ...fmt: any[]): void
  log(sevNum: number, obj: {}, msg?: string, ...fmt: any[]): void
  log(sevNum: number, objOrMsg: string | {}, ...rest: any[]): void {
    if (this.levels[sevNum] === undefined) {
      throw new Error('Unknown log level: ' + sevNum)
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

  subLogger(name?: string): BaseLogger {
    let subLogger
    if (name) {
      if (!this.subLoggers) {
        this.subLoggers = new Map()
      } else {
        subLogger = this.subLoggers.get(name)
      }
    }
    if (!subLogger) {
      subLogger = new this.cls({
        cls: this.cls,
        levels: this.levels,
        parent: this,
      })
      if (name) {
        this.subLoggers!.set(name, subLogger)
      }
    }
    return subLogger
  }

  withContext(ctx: ({} | (() => {}))): BaseLogger {
    return new this.cls({
      cls: this.cls,
      levels: this.levels,
      parent: this,
      transforms: [addContext(ctx)],
    })
  }
}

export function makeLoggerClass<L extends string>(levels: { [k: number]: L } & readonly string[]):
  { new(opts?: LoggerOptions & { minLevel?: number | L }): Logger<L> }
{
  const loggerClass: any = class CustomLogger extends BaseLogger {
    constructor(loggerOptions?: LoggerOptions & { minLevel?: number | L }) {
      super({ ...loggerOptions, levels, cls: loggerClass })
    }
  }

  for (let i = 0; i < levels.length; ++i) {
    loggerClass.prototype[levels[i]] = function (...args: any[]): void {
      this.log(i, ...args)
    }
  }

  return loggerClass
}

export function makeLogger<L extends string>(
  opts: LoggerOptionsWithLevels & { levels: { [k: number]: L } & readonly string[], minLevel?: number | L }
): Logger<L> {
  const cls = makeLoggerClass(opts.levels)
  return new cls(opts)
}