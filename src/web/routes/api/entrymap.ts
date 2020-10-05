/**
 * entrymap.ts
 * GET    / : get entrymap
 * POST   / : create/update entrymap
 * DELETE / : delete entrymap
 * GET    /list : list entrymaps
 */

import { Router } from 'express'
import { ERR_ACCESS_DENIED, ERR_NOT_FOUND } from '../../../constant'
import { Entry, EntryType } from '../../../schemas/entry'
import { EntryMap } from '../../../schemas/entrymap'
import { ensure, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'

export const EntrymapRouter = Router()

EntrymapRouter.get('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const map = await EntryMap.findOne({ to: req.query.entry, from: req.query.from })
  ensure(map, ERR_NOT_FOUND)
  return res.RESTSend(map)
}))

EntrymapRouter.post('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  ensure(req.admin, ERR_ACCESS_DENIED)
  const entry = await Entry.findOne({ _id: req.query.from, type: EntryType.user })
  ensure(entry, ERR_NOT_FOUND)
  const map = new EntryMap()
  map.from = req.query.from
  map.to = req.query.entry
  map.admin = req.body.admin
  await map.save()
  return res.RESTEnd()
}))

EntrymapRouter.put('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  ensure(req.admin, ERR_ACCESS_DENIED)
  const map = await EntryMap.findOne({ to: req.query.entry, from: req.query.from })
  map.admin = req.body.admin
  await map.save()
  return res.RESTEnd()
}))

EntrymapRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  ensure(req.admin, ERR_ACCESS_DENIED)
  const map = await EntryMap.findOne({ to: req.query.entry, from: req.query.from })
  ensure(map, ERR_NOT_FOUND)
  await map.remove()
  return res.RESTEnd()
}))

EntrymapRouter.get('/list', verifyEntryAccess, PaginationWrap((req) => {
  let query = EntryMap.find({ to: req.query.entry })
  if (req.query.search !== undefined) {
    query = query.where('from').regex(new RegExp(req.query.search.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&'), 'g'))
  }
  return query
}))
