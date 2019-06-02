import safeJsonStringify = require('safe-json-stringify')

export function safeJson(obj: any) {
  try {
    return JSON.stringify(obj)
  } catch(e) {
    return safeJsonStringify(e)
  }
}
