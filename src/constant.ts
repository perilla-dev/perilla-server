import { ensureDirSync } from 'fs-extra'
import { join } from 'path'

// File paths
export const STORE_PATH = join(__dirname, '..', 'files', 'managed')
ensureDirSync(STORE_PATH)
export const FRONTEND_PATH = join(__dirname, '..', 'frontend')
ensureDirSync(FRONTEND_PATH)
export const CONFIG_PATH = join(__dirname, '..', 'config.json')
export const PACKAGE_PATH = join(__dirname, '..', 'package.json')

// Model options
export const ARTICLE = {
  title: {
    minlength: 1,
    maxlength: 50
  },
  content: {
    default: 'No content',
    minlength: 1,
    maxlength: 40960
  },
  tags: {
    default: ['Untagged']
  }
}
export const ENTRY = {
  _id: {
    minlength: 1,
    maxlength: 50,
    validate: (v: string) => /^[^ ]+$/.test(v)
  },
  email: {
    minlength: 1,
    maxlength: 50,
    validate: (v: string) => /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/.test(v)
  }
}
export const FILE = {
  title: {
    minlength: 1,
    maxlength: 50
  },
  description: {
    default: 'No description',
    minlength: 1,
    maxlength: 40960
  },
  tags: {
    default: ['Untagged']
  }
}
export const PROBLEM = {
  title: {
    minlength: 1,
    maxlength: 50
  },
  content: {
    default: 'No content',
    minlength: 1,
    maxlength: 40960
  },
  tags: {
    default: ['Untagged']
  }
}

// Error messages
export const ERR_ACCESS_DENIED = 'Access denied'
export const ERR_NOT_FOUND = 'Not found'
export const ERR_ALREADY_EXISTS = 'Already exists'
export const ERR_NOT_LOGGED_IN = 'Not logged in'
export const ERR_INVALID_REQUEST = 'Invalid request'

// System Limits
export const MAX_PAGINATION_LIMIT = 128
