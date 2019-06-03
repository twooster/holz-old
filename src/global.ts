import { safeJson } from './safe-json'
import { serializeIfError } from './errors'
import { consoleLevels } from './levels'
import { makeLogger } from './holz'

const ttyLogger = (obj: any) => {
  const { level, msg, ...clone } = obj

  let rest = ''
  for (const _ in clone) {
    rest = safeJson(clone, null, 2)
    break
  }

  process.stdout.write(`[${level || 'unknown'}] ${msg}${msg ? ' ' : ''}${rest}\n`)
}

const jsonLogger = (obj: any) => process.stdout.write(safeJson(obj, null, 2) + '\n')

export const logger = makeLogger({
  levels: consoleLevels,
  transforms: [
    serializeIfError
  ],
  outputs: [
    process.stdout.isTTY ? ttyLogger : jsonLogger
  ]
})
