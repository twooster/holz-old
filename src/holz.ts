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

export class BaseLogger {
  subLoggers: Map<string, BaseLogger> | undefined
  minLevel: number | undefined
  levels: readonly string[]
  outputs: undefined | OutputFn[] = []
  transforms: undefined | TransformFn[] = []
  parent: undefined | BaseLogger

  constructor(opts: LoggerOptionsWithLevels) {
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
  log(sevNum: number, msg: {}): void
  log(sevNum: number, ...args: [string | {}, ...any[]]): void {
    if (this.levels[sevNum] === undefined) {
      throw new Error('Unknown log level: ' + sevNum)
    }

    if (this.minLevel !== undefined && sevNum > this.minLevel) {
      return
    }

    let msg = args[0]
    let fmtMsg: { [LogLevel]: number, [k: string]: any }
    if (typeof msg === 'string') {
      if (args.length > 1) {
        msg = args
      }
      fmtMsg = {
        [LogLevel]: sevNum,
        level: this.levels[sevNum],
        msg
      }
    } else {
      fmtMsg = {
        [LogLevel]: sevNum,
        level: this.levels[sevNum],
        ...msg
      }
    }

    return this._log(fmtMsg)
  }

  _log(msg: { [LogLevel]: number }) {
    if (this.minLevel !== undefined && msg[LogLevel] > this.minLevel) {
      return
    }

    if (this.transforms) {
      for (const transform of this.transforms) {
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
      }
    }

    if (this.outputs) {
      for (const output of this.outputs) {
        output(msg)
      }
    }

    if (this.parent) {
      this.parent._log(msg)
    }
  }
}

type LogMethods<Levels extends string> = {
  [l in Levels]: (
    ((msg: {}) => void) &
    ((msg: string, ...fmt: any[]) => void)
  )
}

export type FullLogger<L extends string> =
  BaseLogger &
  LogMethods<L> &
  {
    subLogger(name: string, opts?: LoggerOptions): FullLogger<L>
    withContext(ctx: ({} | (() => {}))): FullLogger<L>
  }

export function makeLoggerClass<L extends string>(levels: { [k: number]: L } & readonly string[]):
  { new(opts?: LoggerOptions & { minLevel?: number | L }): FullLogger<L> }
{
  const loggerClass: any = class Logger extends BaseLogger {
    constructor(loggerOptions?: LoggerOptions & { minLevel?: number | L }) {
      super({ ...loggerOptions, levels })
    }
  }

  loggerClass.prototype.subLogger = function subLogger(name: string): FullLogger<L> {
    let subLogger
    if (!this.subLoggers) {
      this.subLoggers = new Map()
    } else {
      subLogger = this.subLoggers.get(name)
    }
    if (!subLogger) {
      subLogger = new loggerClass({
        parent: this,
        levels: this.levels,
      })
      this.subLoggers.set(name, subLogger)
    }
    return subLogger
  }

  loggerClass.prototype.withContext = function withContext(ctx: ({} | (() => {}))): FullLogger<L> {
    return new loggerClass({
      parent: this,
      transforms: [addContext(ctx)]
    })
  }

  for (let i = 0; i < levels.length; ++i) {
    loggerClass.prototype[levels[i]] = function (...args: any[]): void {
      return this.log(i, ...args)
    }
  }

  return loggerClass
}

export function makeRootLogger<L extends string>(
  opts: LoggerOptionsWithLevels & { levels: { [k: number]: L } & readonly string[], minLevel?: number | L }
): FullLogger<L> {
  const cls = makeLoggerClass(opts.levels)
  return new cls(opts)
}