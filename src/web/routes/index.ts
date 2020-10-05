import { Router } from 'express'
import { verify } from 'jsonwebtoken'
import { config } from '../../config'
import { PACKAGE_PATH } from '../../constant'
import { IRESTResponse } from '../../interfaces/route'
import { APIRouter } from './api'
import { AuthRouter } from './auth'
import { FrontendRouter } from './frontend'
import { RESTWrap } from './util'

export const MainRouter = Router()

MainRouter.use((req, res: IRESTResponse, next) => {
  res.RESTSend = (value: any) => {
    res.json({ status: 'success', payload: value })
  }
  res.RESTFail = (message: any) => {
    res.json({ status: 'failed', payload: message })
  }
  res.RESTEnd = () => {
    res.json({ status: 'success' })
  }
  return next()
})

MainRouter.get('/version', RESTWrap(async (req, res) => {
  const { version } = require(PACKAGE_PATH)
  res.RESTSend({ version })
}))

MainRouter.use(RESTWrap(async (req, res, next) => {
  const token = req.headers['x-access-token'] || (req.body && req.body.access_token) || (req.query && req.query.access_token)
  if (typeof token === 'string' && token) {
    const decoded = verify(token, config.secret) as any
    req.user = decoded._id as string
  }
  return next()
}))

MainRouter.use('/api', APIRouter)
MainRouter.use('/auth', AuthRouter)
MainRouter.use('/', FrontendRouter)
