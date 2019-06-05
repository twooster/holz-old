import safeJsonStringify = require('safe-json-stringify')

export function safeJson(obj: any, fn?: ((k: string, v: any) => any), indent?: number | string) {
  try {
    // First try fast stringify:
    return JSON.stringify(obj, fn, indent)
  } catch {
    // If that doesn't work, try slow-but-safe stringify
    // XXX: Once types for safeJsonStringify are improved, can remove the `as any`
    return (safeJsonStringify as any)(obj, fn, indent)
  }
}
