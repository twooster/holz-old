import safeJsonStringify = require('safe-json-stringify')

export function safeJson(obj: any, fn?: ((k: string, v: any) => any), indent?: number | string) {
  try {
    return JSON.stringify(obj, fn, indent)
  } catch(e) {
    // XXX: Once types for safeJsonStringify are improved, can remove the `as any`
    return (safeJsonStringify as any)(e, fn, indent)
  }
}
