# Holz

A (fairly) simple logging library for logging primarily to stdout, written in
TypeScript with adjustable, type-safe log levels.

You're gonna need Typescript 3.4 for this to work.

## Motivation

Lots of loggers just do too damn much and bring in like 40 packages. I don't
need 40 packages. Neither do you.

I need a logger that supports:

1. Subloggers
2. Context (metadata)
3. Type-safety
4. Easy and simple to compose your own best solution from basic function
   primitives

Additionally, I decided it'd be nice to offer:

1. User configurable levels
2. Support for chained VErrors (see https://github.com/joyent/node-verror)
3. Comes with safe-json out of the box

The following are **non-goals**:

1. Log to file, file rotation
2. Streams everywhere
3. Heavy dependencies
4. Colors

## Usage:

```typescript

import { logger } from 'holz'

logger.info('hi')
// stdout: {"msg":"hi","level":"info"}
// tty stdout: [info] hi
```

Want more customizability than that? Ok.

```typescript
import { makeLogger, addContext, safeJson } from 'holz'

const logger = makeLogger({
  // highest to lowest
  levels: ['flark', 'blurb', 'clem'],
  minLevel: "blurb",
  transforms: [
    addContext(() => ({ time: Date.now() })),
  ],
  outputs: (obj) => console.log(safeJson(obj))
})

logger.flark('whatever')
// {"msg":"whatever","time":12321412312,"level":"flark"}
logger.blurb({ name: "Bob" })
// {"name":"Bob","time":1231242412,"level":"blurb"}
logger.clem("oh no")
// no output, because the minLevel is set to blurb
```
