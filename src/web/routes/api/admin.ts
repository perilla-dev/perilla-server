import { Router } from 'express'
import { Article } from '../../../schemas/article'
import { File } from '../../../schemas/file'
import { Problem } from '../../../schemas/problem'
import { Solution } from '../../../schemas/solution'
import { isSystemAdmin, PaginationWrap } from '../util'

export const adminRouter = Router()

adminRouter.get('/article', isSystemAdmin, PaginationWrap(() => Article.find()))
adminRouter.get('/file', isSystemAdmin, PaginationWrap(() => File.find()))
adminRouter.get('/problem', isSystemAdmin, PaginationWrap(() => Problem.find()))
adminRouter.get('/solution', isSystemAdmin, PaginationWrap(() => Solution.find()))
