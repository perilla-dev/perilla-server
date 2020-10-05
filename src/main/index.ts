import { fork, Worker } from 'cluster'
import { cpus } from 'os'
import { connectDB } from '../database'
import { IPCMessage, IPCMessageType } from '../interfaces/message'
import { log } from '../log'
import { HandleFileGC } from './filegc'
import { HandleSendMail } from './mail'

const handleMessage = (worker: Worker, message: IPCMessage) => {
  switch (message.type) {
    case IPCMessageType.FileGCRequest:
      return HandleFileGC(message.payload)
    case IPCMessageType.SendMailRequest:
      return HandleSendMail(message.payload)
  }
}

const startWorker = () => {
  const worker = fork()
  worker.on('message', (message: IPCMessage) => handleMessage(worker, message))
  worker.on('online', () => {
    log('worker #%d is online', worker.id)
  })
  worker.on('exit', (code, signal) => {
    log('worker #%d exited with code %d (%s)', worker.id, code, signal)
    startWorker()
  })
}

export const startMainService = async () => {
  await connectDB()
  const webTheads = parseInt(process.env.WEB_THEADS, 10) || cpus().length
  for (let tid = 0; tid < webTheads; tid++) { startWorker() }
  log('master started')
}
