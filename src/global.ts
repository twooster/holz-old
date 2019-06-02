import { safeJson } from './safe-json'
import { serializeIfError } from './errors'
import { consoleLevels } from './levels'
import { makeLogger } from './holz'

const ttyLogger = (obj: any) => {
  const clone = Object.assign({}, obj)
  delete clone.level
  delete clone.msg

  const msg = obj.msg ? obj.msg + ' ' : ''
  const rest = Object.keys(clone).length > 0 ? safeJson(clone) : ''

  console.log(`[${obj.level || 'unknown'}] ${msg}${rest}`)
}

const jsonLogger = (obj: any) => safeJson(obj)

export const logger = makeLogger({
  levels: consoleLevels,
  transforms: [
    serializeIfError
  ],
  outputs: [
    process.stdout.isTTY ? ttyLogger : jsonLogger
  ]
})