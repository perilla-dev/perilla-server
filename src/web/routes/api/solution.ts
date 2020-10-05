/**
 * solution.ts
 * GET    / : get solution details
 * POST   / : **rejudge solution**
 * DELETE / : delete solution
 * GET    /list
 */

import { Router } from 'express'
import { ERR_ACCESS_DENIED, ERR_INVALID_REQUEST, ERR_NOT_FOUND } from '../../../constant'
import { Problem } from '../../../schemas/problem'
import { Solution, SolutionResult } from '../../../schemas/solution'
import { Task } from '../../../schemas/task'
import { ensure, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'

export const SolutionRouter = Router()

SolutionRouter.get('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const solution = await Solution.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(solution, ERR_NOT_FOUND)
  return res.RESTSend(solution)
}))

SolutionRouter.post('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const solution = await Solution.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(solution, ERR_NOT_FOUND)
  ensure(req.admin || solution.creator === req.user, ERR_ACCESS_DENIED)
  const problem = await Problem.findOne({ owner: req.query.entry, id: solution.problem })
  ensure(problem.channel, ERR_INVALID_REQUEST)
  try {
    solution.status = SolutionResult.WaitingJudge
    const task = new Task()
    task.problem = problem.data
    task.solution = solution.data
    task.objectID = solution._id
    task.priority = 1
    task.owner = req.query.entry
    task.creator = req.user
    task.channel = problem.channel
    await task.save()
  } catch (e) {
    solution.status = SolutionResult.JudgementFailed
    solution.score = 0
    solution.details = {
      error: e.message
    }
  }
  await solution.save()
  return res.RESTEnd()
}))

SolutionRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const solution = await Solution.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(solution, ERR_NOT_FOUND)
  ensure(req.admin || solution.creator === req.user, ERR_ACCESS_DENIED)
  await solution.remove()
  return res.RESTEnd()
}))

SolutionRouter.get('/list', verifyEntryAccess, PaginationWrap((req) => {
  let base = Solution.find({ owner: req.query.entry }).select('id problem status score updated creator')
  if (req.query.problem !== undefined) {
    base = base.where('problem').equals(req.query.problem)
  }
  if (req.query.status !== undefined) {
    base = base.where('status').equals(req.query.status)
  }
  if (req.query.max !== undefined) {
    base = base.where('score').lte(req.query.max)
  }
  if (req.query.min !== undefined) {
    base = base.where('score').gte(req.query.min)
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
    ensure(['id', 'updated', 'score'].includes(req.query.sortBy), ERR_INVALID_REQUEST)
    if (req.query.descending) { req.query.sortBy = '-' + req.query.sortBy }
    base = base.sort(req.query.sortBy)
  }
  return base
}))
