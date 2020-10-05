import { existsSync, readFileSync } from 'fs-extra'
import { CONFIG_PATH } from './constant'

if (!existsSync(CONFIG_PATH)) { throw new Error('No config.json found') }
const sysconfig = JSON.parse(readFileSync(CONFIG_PATH).toString())
export const config: any = sysconfig
