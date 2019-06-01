import { npmLevels } from './levels'
import { makeRootLogger } from './holz'

export const logger = makeRootLogger({
  levels: npmLevels,
  outputs: [
    obj => {
      console.log(JSON.stringify(obj))
    }
  ]
})
