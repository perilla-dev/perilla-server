import { config } from './config'
import { log } from './log'
import { registerGracefulExitHook } from './utils'
import mongoose = require('mongoose');

export const connectDB = async () => {
  await mongoose.connect(config.db.url, config.db.options as mongoose.ConnectionOptions)
  log('Mongoose connected')
  mongoose.connection.on('error', (err) => {
    log('Mongoose connection error: ' + err)
  })
  mongoose.connection.on('disconnected', () => {
    log('Mongoose disconnected')
  })
  registerGracefulExitHook(async () => {
    return new Promise<void>((resolve) => {
      mongoose.connection.close(resolve)
    })
  })
}
