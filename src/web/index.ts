import { json, urlencoded } from 'body-parser'
import { readFileSync } from 'fs-extra'
import { config } from '../config'
import { connectDB } from '../database'
import { log } from '../log'
import { MainRouter } from './routes'
import express = require('express');
import http = require('http');
import https = require('https');

export const startWebService = async () => {
  await connectDB()

  const app = express()

  app.use(json())
  app.use(urlencoded({ extended: false }))

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-access-token')
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    } else {
      return next()
    }
  })

  app.use(MainRouter)

  if (config.https.enable) {
    const privateKey = readFileSync(config.https.privatekey)
    const certificate = readFileSync(config.https.certificate)
    const credentials = { key: privateKey, cert: certificate }

    const server = https.createServer(credentials, app)
    server.listen(config.https.port, config.https.hostname, () => {
      log('HTTPS server started')
    })
  }

  if (config.http.enable) {
    const server = http.createServer(app)
    server.listen(config.http.port, config.http.hostname, () => {
      log('HTTP server started')
    })
  }

  log('worker started')
}
