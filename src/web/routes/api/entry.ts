/**
 * entry.ts
 * GET    /
 * PUT    /
 * DELETE /
 * GET    /list
 */

import { Router } from 'express'
import { ERR_ACCESS_DENIED, ERR_INVALID_REQUEST, ERR_NOT_FOUND } from '../../../constant'
import { Entry, EntryType } from '../../../schemas/entry'
import { ensure, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'

export const EntryRouter = Router()

EntryRouter.get('/', RESTWrap(async (req, res) => {
  const entry = await Entry.findById(req.query.entry).select('-hash -salt')
  ensure(entry, ERR_NOT_FOUND)
  return res.RESTSend(entry)
}))

EntryRouter.put('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const entry = await Entry.findById(req.query.entry)
  ensure(entry, ERR_NOT_FOUND)
  ensure(req.admin, ERR_ACCESS_DENIED)
  entry.description = req.body.description || entry.description
  entry.email = req.body.email || entry.email
  if (req.body.password && entry.type === EntryType.user) {
    entry.setPassword(req.body.password)
  }
  await entry.save()
  return res.RESTEnd()
}))

EntryRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const entry = await Entry.findById(req.query.entry)
  ensure(entry, ERR_NOT_FOUND)
  ensure(req.admin, ERR_ACCESS_DENIED)
  await entry.remove()
  return res.RESTEnd()
}))

EntryRouter.get('/list', PaginationWrap((req) => {
  let base = Entry.find().select('-hash -salt')
  if (req.query.search !== undefined) {
    base = base.where('_id').regex(new RegExp(req.query.search.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&'), 'g'))
  }
  if (req.query.before !== undefined) {
    base = base.where('created').lte(req.query.before)
  }
  if (req.query.after !== undefined) {
    base = base.where('created').gte(req.query.after)
  }
  if (req.query.type !== undefined) {
    base = base.where('type').equals(req.query.type)
  }
  if (req.query.sortBy !== undefined) {
    ensure(['_id', 'created'].includes(req.query.sortBy), ERR_INVALID_REQUEST)
    if (req.query.descending) { req.query.sortBy = '-' + req.query.sortBy }
    base = base.sort(req.query.sortBy)
  }
  return base
}))
