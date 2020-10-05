import { isMaster } from 'cluster'
import { stat } from 'fs-extra'
import { IPCMessage } from './interfaces/message'
import { log } from './log'

export const getBaseURL = (hostname: string, port: number) => {
  return 'http://' + hostname + (port === 80 ? '' : ':' + port)
}

export const getFileSize = (path: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    stat(path, (err, stats) => {
      if (err) { return reject(err) }
      resolve(stats.size)
    })
  })
}

export const sendMessage = isMaster ? undefined : (message: IPCMessage) => {
  process.send(message)
}

type IGracefulExitHook = () => void | Promise<void>;
const gracefulExitHooks: IGracefulExitHook[] = []

export const registerGracefulExitHook = (hook: IGracefulExitHook) => {
  gracefulExitHooks.push(hook)
}

export const gracefulExit = async (msg: string) => {
  for (const hook of gracefulExitHooks) { await hook() }
  log(`Exited: ${msg}`)
  process.exit(0)
}

process.once('SIGUSR2', () => { gracefulExit('SIGUSR2(nodemon restart)') })
process.on('SIGINT', () => { gracefulExit('SIGINT(app termination)') })
process.on('SIGTERM', () => { gracefulExit('SIGTERM(system termination)') })
