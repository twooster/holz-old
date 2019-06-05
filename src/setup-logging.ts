import { LoggerOptions } from './logger'
import { Registry } from './registry'
import { safeJson } from './safe-json'
import { serializeErrors } from './errors'
import { consoleLevels } from './levels'


export function setupLogging<L extends string>(rootLoggerOpts: LoggerOptions<L>) {
  const registry = new Registry(rootLoggerOpts)
  return {
    logger: registry.rootLogger,
    getLogger: registry.getLogger.bind(registry)
  }
}

export const ttyLogger = (obj: any) => {
  const { level, msg, ...clone } = obj

  let rest = ''
  for (const _ in clone) {
    rest = safeJson(clone, undefined, 2)
    break
  }

  process.stdout.write(`[${level || 'unknown'}] ${msg}${msg ? ' ' : ''}${rest}\n`)
}

export const jsonLogger = (obj: any) => process.stdout.write(safeJson(obj, undefined, 2) + '\n')

export const setupDefaultLogging = () => setupLogging({
  levels: consoleLevels,
  transforms: [
    serializeErrors
  ],
  outputs: [
    process.stdout.isTTY ? ttyLogger : jsonLogger
  ]
})