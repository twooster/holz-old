# Holz

A (fairly) simple logging library for logging primarily to stdout, written in
TypeScript with adjustable, type-safe log levels.

Alpha alpha alpha alpha. Sketchy code ahead.

## Usage:

```typescript
import { makeLoggerWithLevels, compose, addContext } from 'holz'
import { safeJsonStringify } from 'safe-json-stringify'

const logger = makeRootLogger({
  transforms: [
    addContext(() => ({ time: Date.now() })),
  ],
  levels: ['error', 'warn', 'info', 'debug', 'trace'],
  outputs: compose(safeJsonStringify, console.log)
})

logger.warn('whatever')
// {"msg":"whatever","time":12321412312}
logger.warn({ name: "Bob" })
// {"name":"Bob","time":1231242412}

const httpLogger = logger.subLogger('http').addTransforms(tag('http'))

httpLogger === logger.subLogger('http')
// true

httpLogger.info('HTTP request started')
// {"msg":"HTTP request started","time":1232142412,"tags":["http"]}

function handleRequest(req) {
  const requestLogger = httpLogger.withContext({ reqId: req.id })
  handler(req, requestLogger)
}
```
