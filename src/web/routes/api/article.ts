/**
 * article.ts
 * GET    /
 * PUT    /
 * DELETE /
 * POST   /
 * GET    /list
 */

import { Router } from 'express'
import { ERR_ACCESS_DENIED, ERR_INVALID_REQUEST, ERR_NOT_FOUND } from '../../../constant'
import { Article } from '../../../schemas/article'
import { ensure, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'

export const ArticleRouter = Router()

ArticleRouter.get('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const article = await Article.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(article, ERR_NOT_FOUND)
  return res.RESTSend(article)
}))

ArticleRouter.put('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const article = await Article.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(article, ERR_NOT_FOUND)
  ensure(req.admin || article.creator === req.user, ERR_ACCESS_DENIED)
  article.title = req.body.title || article.title
  article.content = req.body.content || article.content
  article.tags = req.body.tags || article.tags
  await article.save()
  return res.RESTEnd()
}))

ArticleRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const article = await Article.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(article, ERR_NOT_FOUND)
  ensure(req.admin || article.creator === req.user, ERR_ACCESS_DENIED)
  await article.remove()
  return res.RESTEnd()
}))

ArticleRouter.post('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const article = new Article()
  article.title = req.body.title || article.title
  article.content = req.body.content || article.content
  article.tags = req.body.tags || article.tags
  article.owner = req.query.entry
  article.creator = req.user
  await article.save()
  return res.RESTSend(article.id)
}))

ArticleRouter.get('/list', verifyEntryAccess, PaginationWrap((req) => {
  let base = Article.find({ owner: req.query.entry }).select('id title tags updated creator')
  if (req.query.tags !== undefined) {
    base = base.where('tags').all(req.query.tags)
  }
  if (req.query.search !== undefined) {
    base = base.where('title').regex(new RegExp(req.query.search.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&'), 'g'))
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
    ensure(['id', 'updated', 'title'].includes(req.query.sortBy), ERR_INVALID_REQUEST)
    if (req.query.descending) { req.query.sortBy = '-' + req.query.sortBy }
    base = base.sort(req.query.sortBy)
  }
  return base
}))
