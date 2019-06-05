const { setupDefaultLogging } = require('./dist/setup-logging')

const { getLogger, logger } = setupDefaultLogging()
export { getLogger, logger }
