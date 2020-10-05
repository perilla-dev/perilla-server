import { Router } from 'express'
import { adminRouter } from './admin'
import { ArticleRouter } from './article'
import { EntryRouter } from './entry'
import { EntrymapRouter } from './entrymap'
import { FileRouter } from './file'
import { JudgerRouter } from './judger'
import { MiscRouter } from './misc'
import { ProblemRouter } from './problem'
import { SolutionRouter } from './solution'
import { SystemMapRouter } from './systemmap'

export const APIRouter = Router()

APIRouter.use('/admin', adminRouter)
APIRouter.use('/article', ArticleRouter)
APIRouter.use('/entry', EntryRouter)
APIRouter.use('/entrymap', EntrymapRouter)
APIRouter.use('/file', FileRouter)
APIRouter.use('/judger', JudgerRouter)
APIRouter.use('/misc', MiscRouter)
APIRouter.use('/problem', ProblemRouter)
APIRouter.use('/solution', SolutionRouter)
APIRouter.use('/systemmap', SystemMapRouter)
