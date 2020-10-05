/**
 * systemmap.ts
 * POST   /
 * DELETE /
 * LIST   /
 */

import { Router } from 'express'
import { ERR_NOT_FOUND } from '../../../constant'
import { Entry, EntryType } from '../../../schemas/entry'
import { SystemMap } from '../../../schemas/systemmap'
import { ensure, isSystemAdmin, PaginationWrap, RESTWrap } from '../util'

export const SystemMapRouter = Router()

SystemMapRouter.post('/', isSystemAdmin, RESTWrap(async (req, res) => {
  const entry = await Entry.findOne({ _id: req.query.user, type: EntryType.user })
  ensure(entry, ERR_NOT_FOUND)
  const map = new SystemMap()
  map.user = req.query.user
  await map.save()
  return res.RESTEnd()
}))

SystemMapRouter.delete('/', isSystemAdmin, RESTWrap(async (req, res) => {
  const map = await SystemMap.findOne({ user: req.query.user })
  ensure(map, ERR_NOT_FOUND)
  await map.remove()
  return res.RESTEnd()
}))

SystemMapRouter.get('/list', isSystemAdmin, PaginationWrap(() => SystemMap.find()))
