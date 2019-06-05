import { Logger, LoggerOptions, makeLogger } from './logger'
import { prepend } from './transforms'

interface LoggerMap<L extends string> extends WeakMap<Logger<L>, Map<string, Logger<L>>> { }

export class Registry<L extends string> {
  children: LoggerMap<L> = new WeakMap()
  rootLogger: Logger<L>

  constructor(rootLoggerOptions: LoggerOptions<L>) {
    this.rootLogger = makeLogger(rootLoggerOptions)
  }

  getLogger(...path: string[]): Logger<L> {
    let curLogger = this.rootLogger
    for (const atom of path) {
      let map = this.children.get(curLogger)
      if (!map) {
        map = new Map()
        this.children.set(curLogger, map)
      }

      if (map.has(atom)) {
        curLogger = map.get(atom)!
      } else {
        curLogger = curLogger.child().addTransforms(prepend('logger', atom))
        map.set(atom, curLogger)
      }
    }
    return curLogger
  }
}