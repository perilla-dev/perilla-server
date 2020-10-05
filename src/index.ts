import { isMaster } from 'cluster'
import { startMainService } from './main'
import { startWebService } from './web'

if (isMaster) {
  startMainService()
} else {
  startWebService()
}
