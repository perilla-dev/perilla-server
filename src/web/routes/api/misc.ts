import { Router } from 'express'
import { EntryMap } from '../../../schemas/entrymap'
import { isLoggedin, PaginationWrap } from '../util'

export const MiscRouter = Router()

MiscRouter.get('/accessible', isLoggedin, PaginationWrap((req) => {
  let query = EntryMap.find({ from: req.user })
  if (req.query.search !== undefined) {
    query = query.where('to').regex(new RegExp(req.query.search.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&'), 'g'))
  }
  return query
}))
