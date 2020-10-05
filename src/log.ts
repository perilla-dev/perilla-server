import { isMaster, worker } from 'cluster'
import debug = require('debug');

export const log = debug('perilla:' + (isMaster ? 'master' : 'worker #' + worker.id))
