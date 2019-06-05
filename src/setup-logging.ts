import { Registry } from './registry'
import { SubloggerOptions, LoggerOptions } from './logger'
import { consoleLevels } from './levels'
import { safeJson } from './safe-json'
import { serializeErrors } from './transforms'

interface SubloggerOptionsByKey<L extends string> {
  [k: string]: SubloggerOptions<L>
}

export function setupLogging<L extends string>(rootLoggerOpts: LoggerOptions<L>, subLoggers: SubloggerOptionsByKey<L> = {}) {
  const registry = new Registry(rootLoggerOpts)
  for (const [dottedPath, opts] of Object.entries(subLoggers)) {
    const path = dottedPath.split('.')
    const logger = registry.getLogger(...path)
    Object.assign(logger, opts)
  }
  return {
    registry,
    logger: registry.rootLogger,
    getLogger: registry.getLogger.bind(registry)
  }
}

export const ttyLogger = (obj: any) => {
  const { level, msg, ...clone } = obj

  let rest = ''
  // A bit cheaper than checking Object.keys(clone).length
  for (const _ in clone) {
    rest = safeJson(clone, undefined, 2)
    break
  }

  process.stdout.write(`[${level || 'unknown'}] ${msg}${msg && rest ? ' ' : ''}${rest}\n`)
}

export const jsonLogger = (obj: any) => process.stdout.write(safeJson(obj, undefined, 2) + '\n')

export const setupDefaultLogging = (subLoggers: SubloggerOptionsByKey<typeof consoleLevels[number]> = {}) => setupLogging({
  levels: consoleLevels,
  transforms: [
    serializeErrors
  ],
  outputs: [
    process.stdout.isTTY ? ttyLogger : jsonLogger
  ]
}, subLoggers)

