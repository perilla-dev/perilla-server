/**
 * Judger apis
 */

import { Router } from 'express'
import { join, resolve } from 'path'
import { ERR_INVALID_REQUEST, ERR_NOT_FOUND, STORE_PATH } from '../../../constant'
import { File } from '../../../schemas/file'
import { Solution } from '../../../schemas/solution'
import { Task } from '../../../schemas/task'
import { ensure, isSystemAdmin, RESTWrap } from '../util'

export const JudgerRouter = Router()

JudgerRouter.get('/pop', isSystemAdmin, RESTWrap(async (req, res) => {
  ensure(req.query.channels instanceof Array, ERR_INVALID_REQUEST)
  const task = await Task.findOneAndRemove().where('channel').in(req.query.channels).sort('priority')
  ensure(task, ERR_NOT_FOUND)
  res.RESTSend(task)
}))

JudgerRouter.post('/', isSystemAdmin, RESTWrap(async (req, res) => {
  const solution = await Solution.findById(req.query.objectID)
  ensure(solution, ERR_NOT_FOUND)
  solution.status = req.body.status
  solution.score = req.body.score
  solution.details = req.body.details
  await solution.save()
  res.RESTEnd()
}))

JudgerRouter.get('/resolve', isSystemAdmin, RESTWrap(async (req, res) => {
  const file = await File.findOne({ owner: req.query.owner, id: req.query.id })
  ensure(file, ERR_NOT_FOUND)
  res.RESTSend(file)
}))

JudgerRouter.get('/download', isSystemAdmin, RESTWrap(async (req, res) => {
  const path = resolve(join(STORE_PATH, req.query.hash))
  res.sendFile(path)
}))
