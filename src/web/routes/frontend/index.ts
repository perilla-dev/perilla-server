import { FRONTEND_PATH } from '../../../constant'
import express = require('express');

export const FrontendRouter = express.Router()

FrontendRouter.use(express.static(FRONTEND_PATH))
