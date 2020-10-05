/**
 * solution.ts
 * GET    /
 * POST   /
 * PUT    /
 * DELETE /
 * POST   /submit
 * GET    /list
 */

import { Router } from 'express'
import { ERR_ACCESS_DENIED, ERR_INVALID_REQUEST, ERR_NOT_FOUND } from '../../../constant'
import { Problem } from '../../../schemas/problem'
import { Solution, SolutionResult } from '../../../schemas/solution'
import { Task } from '../../../schemas/task'
import { ensure, PaginationWrap, RESTWrap, verifyEntryAccess } from '../util'

export const ProblemRouter = Router()

ProblemRouter.get('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = await Problem.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(problem, ERR_NOT_FOUND)
  return res.RESTSend(problem)
}))

ProblemRouter.put('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = await Problem.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(problem, ERR_NOT_FOUND)
  ensure(req.admin || problem.creator === req.user, ERR_ACCESS_DENIED)
  problem.title = req.body.title || problem.title
  problem.content = req.body.content || problem.content
  problem.data = req.body.data || problem.data
  problem.channel = req.body.channel || problem.channel
  problem.tags = req.body.tags || problem.tags
  await problem.save()
  return res.RESTEnd()
}))

ProblemRouter.delete('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = await Problem.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(problem, ERR_NOT_FOUND)
  ensure(req.admin || problem.creator === req.user, ERR_ACCESS_DENIED)
  await problem.remove()
  return res.RESTEnd()
}))

ProblemRouter.post('/', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = new Problem()
  problem.title = req.body.title || problem.title
  problem.content = req.body.content || problem.content
  problem.data = req.body.data || problem.data
  problem.channel = req.body.channel || problem.channel
  problem.tags = req.body.tags || problem.tags
  problem.owner = req.query.entry
  problem.creator = req.user
  await problem.save()
  return res.RESTSend(problem.id)
}))

ProblemRouter.post('/submit', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = await Problem.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(problem, ERR_NOT_FOUND)
  ensure(problem.channel, ERR_INVALID_REQUEST)
  const solution = new Solution()
  solution.problem = problem.id
  solution.creator = req.user
  solution.data = req.body.data
  solution.owner = req.query.entry
  await solution.save() // Collect ID
  try {
    solution.status = SolutionResult.WaitingJudge
    const task = new Task()
    task.problem = problem.data
    task.solution = solution.data
    task.objectID = solution._id
    task.priority = 0
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
  return res.RESTSend(solution.id)
}))

ProblemRouter.post('/rejudge', verifyEntryAccess, RESTWrap(async (req, res) => {
  const problem = await Problem.findOne({ owner: req.query.entry, id: req.query.id })
  ensure(problem, ERR_NOT_FOUND)
  ensure(problem.channel, ERR_INVALID_REQUEST)
  const solutions = await Solution.find({ owner: req.query.entry, problem: problem.id })
  for (const solution of solutions) {
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
  }
  return res.RESTEnd()
}))

ProblemRouter.get('/list', verifyEntryAccess, PaginationWrap((req) => {
  let base = Problem.find({ owner: req.query.entry }).select('id title tags updated creator')
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
