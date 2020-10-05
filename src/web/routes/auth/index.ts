import { Router } from 'express'
import { sign, verify } from 'jsonwebtoken'
import { config } from '../../../config'
import { ERR_ACCESS_DENIED, ERR_INVALID_REQUEST, ERR_NOT_FOUND } from '../../../constant'
import { IPCMessageType } from '../../../interfaces/message'
import { Entry, EntryType } from '../../../schemas/entry'
import { EntryMap } from '../../../schemas/entrymap'
import { sendMessage } from '../../../utils'
import { ensure, isLoggedin, RESTWrap } from '../util'

export const AuthRouter = Router()

if (config.mail.enable) {
  AuthRouter.post('/register', RESTWrap(async (req, res) => {
    const token = sign({ username: req.body.username, email: req.body.email, password: req.body.password }, config.secret, { expiresIn: '1h' })
    const verifyURL = `${config.mail.baseURL}/auth/register?token=${token}`
    sendMessage({
      type: IPCMessageType.SendMailRequest,
      payload: {
        to: req.body.email,
        subject: 'Confirm registration',
        html: `Please open <a href="${verifyURL}">${verifyURL}</a> to confirm your registration`
      }
    })
    res.RESTSend('Please check your inbox')
  }))

  AuthRouter.get('/register', RESTWrap(async (req, res) => {
    const decoded = verify(req.query.token, config.secret) as any
    const entry = new Entry()
    entry._id = decoded.username
    entry.email = decoded.email
    entry.type = EntryType.user
    entry.setPassword(decoded.password)
    await entry.save()
    res.RESTSend('Registration Completed. Please login')
  }))

  AuthRouter.post('/creategroup', isLoggedin, RESTWrap(async (req, res) => {
    const token = sign({ name: req.body.name, email: req.body.email, user: req.user }, config.secret, { expiresIn: '1h' })
    const verifyURL = `${config.mail.baseURL}/auth/creategroup?token=${token}`
    sendMessage({
      type: IPCMessageType.SendMailRequest,
      payload: {
        to: req.body.email,
        subject: 'Confirm group creation',
        html: `Please open <a href="${verifyURL}">${verifyURL}</a> to confirm your group creation`
      }
    })
    res.RESTSend('Please check your inbox')
  }))

  AuthRouter.get('/creategroup', RESTWrap(async (req, res) => {
    const decoded = verify(req.query.token, config.secret) as any
    const entry = new Entry()
    entry._id = decoded.name
    entry.email = decoded.email
    entry.type = EntryType.group
    await entry.save()
    const entrymap = new EntryMap()
    entrymap.from = decoded.user
    entrymap.to = entry._id
    entrymap.admin = true
    await entrymap.save()
    res.RESTSend('Completed.')
  }))
} else {
  AuthRouter.post('/register', RESTWrap(async (req, res) => {
    const entry = new Entry()
    entry._id = req.body.username
    entry.email = req.body.email
    entry.type = EntryType.user
    entry.setPassword(req.body.password)
    await entry.save()
    res.RESTSend('Registration Completed. Please login')
  }))

  AuthRouter.post('/creategroup', isLoggedin, RESTWrap(async (req, res) => {
    const entry = new Entry()
    entry._id = req.body.name
    entry.email = req.body.email
    entry.type = EntryType.group
    await entry.save()
    const entrymap = new EntryMap()
    entrymap.from = req.user
    entrymap.to = entry._id
    entrymap.admin = true
    await entrymap.save()
    res.RESTSend('Completed.')
  }))
}

AuthRouter.post('/login', RESTWrap(async (req, res) => {
  const entry = await Entry.findById(req.body.username)
  ensure(entry, ERR_NOT_FOUND)
  if (entry.type !== EntryType.user) { throw new Error(ERR_INVALID_REQUEST) }
  ensure(entry.validPassword(req.body.password), ERR_ACCESS_DENIED)
  const token = sign({ _id: entry._id }, config.secret, { expiresIn: '1d' })
  return res.RESTSend(token)
}))
