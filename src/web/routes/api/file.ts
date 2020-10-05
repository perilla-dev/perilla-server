/**
 * file.ts
 * GET    /   : get file details
 * PUT    /   : update file details
 * DELETE /   : delete file
 * GET    /raw: get file content
 * POST   /   : create file
 * GET    /list: list files
 */

import { Router } from 'express'
import { createWriteStream, existsSync, moveSync } from 'fs-extra'
import { lookup } from 'mime-types'
import { join } from 'path'
import { file as createTmpFile } from 'tmp'
import { ERR_ACCESS_DENIED, ERR_ALREADY_EXISTS, ERR_INVALID_REQUEST, ERR_NOT_FOUND, STORE_PATH } from '../../../constant'
import { IPCMessageType } from '../../../interfaces/message'
import { File } from '../../../schemas/file'
import { sendMessage } from '../../../utils'
import { ensure, isLoggedin, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'
import Busboy = require('busboy');

// tslint:disable-next-line:no-var-requires
const createKeccakHash = require('keccak')

export const FileRouter = Router()

FileRouter.get('/provide', isLoggedin, RESTWrap(async (req, res) => {
  const dist = join(STORE_PATH, req.query.hash)
  if (existsSync(dist)) { throw new Error(ERR_ALREADY_EXISTS) }
  res.RESTEnd()
}))

FileRouter.post('/provide', isLoggedin, RESTWrap((req, res) => {
  const busboy = new Busboy({ headers: req.headers })
  const promises: Array<Promise<string>> = []
  busboy.on('file', (fieldname, stream) => {
    promises.push(new Promise<string>((resolve, reject) => {
      createTmpFile((err, path) => {
        if (err) { return reject(err) }
        const keccak256 = createKeccakHash('keccak256')
        const ws = createWriteStream(path)
        stream.on('data', (chunk) => {
          keccak256.update(chunk)
          ws.write(chunk)
        })
        stream.on('end', () => {
          const sha3 = keccak256.digest('hex')
          ws.end(() => {
            if (!existsSync(join(STORE_PATH, sha3))) {
              moveSync(path, join(STORE_PATH, sha3))
            }
            return resolve(sha3)
          })
        })
        stream.on('error', e => {
          return reject(e)
        })
      })
    }))
  })
  busboy.on('finish', async () => {
    try {
      const result = await Promise.all(promises)
      res.RESTSend(result)
    } catch (e) {
      res.RESTFail(e.message)
    }
  })
  req.pipe(busboy)
}))

FileRouter.get('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const file = await File.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(file, ERR_NOT_FOUND)
  return res.RESTSend(file)
}))

FileRouter.put('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const file = await File.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(file, ERR_NOT_FOUND)
  ensure(req.admin || file.creator === req.user, ERR_ACCESS_DENIED)
  file.name = req.body.name || file.name
  file.type = req.body.type || lookup(file.name) || file.type || 'text/plain'
  file.description = req.body.description || file.name
  file.tags = req.body.tags || file.tags
  if (req.body.hash) { await file.setFile(req.body.hash) }
  await file.save()
  return res.RESTEnd()
}))

FileRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const file = await File.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(file, ERR_NOT_FOUND)
  ensure(req.admin || file.creator === req.user, ERR_ACCESS_DENIED)
  sendMessage({ type: IPCMessageType.FileGCRequest, payload: file.hash })
  await file.remove()
  return res.RESTEnd()
}))

FileRouter.post('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const file = new File()
  await file.setFile(req.body.hash)
  file.owner = req.query.entry
  file.creator = req.user
  file.name = req.body.name
  file.type = req.body.type || lookup(file.name) || file.type || 'text/plain'
  file.description = req.body.description || file.name
  file.tags = req.body.tags || file.tags
  await file.save()
  return res.RESTSend(file.id)
}))

FileRouter.get('/raw', verifyEntryAccess, RESTWrap(async (req, res) => {
  const file = await File.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(file, ERR_NOT_FOUND)
  return res.sendFile(file.getPath(), { headers: { 'Content-Type': file.type } })
}))

FileRouter.get('/list', verifyEntryAccess, PaginationWrap((req) => {
  let base = File.find({ owner: req.query.entry }).select('id name type tags updated creator')
  if (req.query.tags !== undefined) {
    base = base.where('tags').all(req.query.tags)
  }
  if (req.query.type !== undefined) {
    base = base.where('type').equals(req.query.type)
  }
  if (req.query.search !== undefined) {
    base = base.where('name').regex(new RegExp(req.query.search.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&'), 'g'))
  }
  if (req.query.before !== undefined) {
    base = base.where('updated').lte(req.query.before)
  }
  if (req.query.after !== undefined) {
    base = base.where('updated').gte(req.query.after)
  }
  if (req.query.creator !== undefined) {
    base = base.where('creator').equals(req.query.creator)
  }
  if (req.query.sortBy !== undefined) {
    ensure(['id', 'updated', 'name'].includes(req.query.sortBy), ERR_INVALID_REQUEST)
    if (req.query.descending) { req.query.sortBy = '-' + req.query.sortBy }
    base = base.sort(req.query.sortBy)
  }
  return base
}))
