// tslint:disable:no-console
import c from 'chalk'
import { existsSync, move, readFileSync, removeSync, unlinkSync, writeFileSync } from 'fs-extra'
import { join } from 'path'
import { generate } from 'randomstring'
import { get } from 'request'
import { dirSync } from 'tmp'
import { Extract } from 'unzipper'
import { FRONTEND_PATH, PACKAGE_PATH } from './constant'
import commander = require('commander');
import mongoose = require('mongoose');
import prompts = require('prompts');

const version = JSON.parse(readFileSync(PACKAGE_PATH).toString()).version

commander
  .version(version)

const readbool = async (message: string, initial: boolean = false) => (await prompts({ type: 'confirm', name: 'v', message, initial })).v
const readpass = async () => (await prompts({ type: 'password', name: 'v', message: 'Please input password' })).v

const uninstall = async () => {
  console.log('[INFO] config.json exists.')
  if (await readbool('continue will overwrite exist data. confirm?')) {
    console.log('[INFO] removing managed files...')
    const oldConfig = JSON.parse(readFileSync('config.json').toString())
    try {
      removeSync('files')
      unlinkSync('config.json')
    } catch (e) {
      console.log('[ERROR] ' + e.message)
      if (!await readbool('continue?')) { process.exit(0) }
    }
    console.log('[INFO] Droping database...')
    await mongoose.connect(oldConfig.db.url, oldConfig.db.options)
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  } else {
    process.exit(0)
  }
}

const generateConfig = async () => {
  const questions = [
    {
      type: 'text',
      name: 'db_url',
      message: 'Mongodb URL',
      initial: 'mongodb://localhost:27017/perilla'
    },
    {
      type: 'text',
      name: 'http_hostname',
      message: 'HTTP Hostname',
      initial: 'localhost'
    },
    {
      type: 'number',
      name: 'http_port',
      message: 'HTTP Port',
      initial: 8680,
      min: 1,
      max: 65535
    },
    {
      type: 'text',
      name: 'secret',
      message: 'secret',
      initial: generate(50)
    }
  ]
  const answers = await prompts(questions)
  const config = {
    db: {
      url: answers.db_url,
      options: {
        useNewUrlParser: true,
        useCreateIndex: true
      }
    },
    http: {
      enable: true,
      port: answers.http_port,
      hostname: answers.http_hostname
    },
    https: {
      enable: false,
      port: 443,
      hostname: 'localhost',
      certificate: '',
      privatekey: ''
    },
    mail: {
      enable: false
    },
    secret: answers.secret
  }
  writeFileSync('config.json', JSON.stringify(config, null, '\t'))
}

const InitializeDatabase = async () => {
  await require('./database').connectDB()
  const { Entry, EntryType } = require('./schemas/entry')
  const admin = new Entry()
  admin._id = 'Administrator'
  admin.description = 'System administrator'
  admin.email = 'admin@perilla.js.org'
  admin.type = EntryType.user
  admin.setPassword(await readpass())
  await admin.save()
  const { SystemMap } = require('./schemas/systemmap')
  const map = new SystemMap()
  map.user = admin._id
  await map.save()
}

commander
  .command('init')
  .description('Initialize the system')
  .action(async () => {
    // 0. remove exists installition
    // 1. Compile typescript code into javascript
    // 2. Generate configuration file
    // 3. Initialize database

    console.log('[INFO] Initializing the system...')
    console.log('[INFO] [STEP 1/4] Checking environment...')
    if (existsSync('config.json')) { await uninstall() }
    console.log('[INFO] [STEP 2/4]  Generating config...')
    await generateConfig()
    console.log('[INFO] [STEP 3/4] Initializing database...')
    await InitializeDatabase()
    console.log('[INFO] ✔️ Done')
    console.log('[TIP] use `yarn start` to start perilla')
    console.log('[TIP] Edit config.json to customize perilla.')
    console.log('[TIP] Please read https://perilla.js.org for more information')
    const { gracefulExit } = require('./utils')
    gracefulExit('cli finished')
  })

const createEntry = async (id: string) => {
  await require('./database').connectDB()
  const questions = [
    {
      type: 'text',
      name: 'email',
      message: 'Entry email'
    },
    {
      type: 'select',
      name: 'type',
      message: 'Entry type',
      choices: [
        { title: 'User', value: 0 },
        { title: 'Group', value: 1 }
      ]
    }
  ]
  const answers = await prompts(questions)
  const { Entry, EntryType } = require('./schemas/entry')
  const entry = new Entry()
  entry._id = id
  entry.email = answers.email
  entry.type = answers.type
  if (entry.type === EntryType.user) {
    entry.setPassword(await readpass())
  }
  await entry.save()
  console.log(`[INFO] 😙 Welcome, ${id}.`)
}

const removeEntry = async (id: string) => {
  await require('./database').connectDB()
  const { Entry } = require('./schemas/entry')
  const entry = await Entry.findById(id)
  if (!entry) { throw new Error('Entry not found') }
  await entry.remove()
  console.log(`[INFO] 🗑 ${id} removed.`)
}

const cp = (obj: any, key: any) => {
  return c.blueBright(key) + '\t' + c.redBright(obj[key])
}

const modifyEntry = async (id: string) => {
  await require('./database').connectDB()
  const { Entry, EntryType } = require('./schemas/entry')
  const entry = await Entry.findById(id)
  if (!entry) { throw new Error('Entry not found') }
  console.log(cp(entry, '_id'))
  console.log(cp(entry, 'description'))
  console.log(cp(entry, 'email'))
  console.log(cp(entry, 'created'))
  console.log(cp(entry, 'type'))
  if (entry.type === EntryType.user) {
    const { SystemMap } = require('./schemas/systemmap')
    let map = await SystemMap.findOne({ user: id })
    console.log(map ? 'This user is a system administrator' : 'This user is not a system administrator')
    if (await readbool('Change password')) {
      entry.setPassword(await readpass())
    }
    if (map) {
      if (await readbool('Remove administrator privilege?')) {
        await map.remove()
      }
    } else {
      if (await readbool('Grant administrator privilege?')) {
        map = new SystemMap()
        map.user = id
        await map.save()
      }
    }
  }
  await entry.save()
}

commander
  .command('entry <id>')
  .description('Entry utils')
  .option('-c, --create', 'Create entry')
  .option('-r, --remove', 'Delete entry')
  .option('-m, --modify', 'Modify entry')
  .action(async (id, cmd) => {
    try {
      if (cmd.create) {
        await createEntry(id)
      }
      if (cmd.remove) {
        await removeEntry(id)
      }
      if (cmd.modify) {
        await modifyEntry(id)
      }
    } catch (e) {
      console.log(e.message)
    }
    const { gracefulExit } = require('./utils')
    gracefulExit('cli finished')
  })

const removeFrontend = () => {
  removeSync(FRONTEND_PATH)
}

const updateFrontend = async () => {
  removeFrontend()
  const url = 'https://github.com/ZhangZisu/perilla/archive/gh-pages.zip'
  console.log('Downloading latest frontend file from GitHub...')
  const tmp = dirSync()
  await new Promise<void>((resolve, reject) => {
    get(url).pipe(Extract({ path: tmp.name })).on('close', resolve).on('error', reject)
  })
  await move(join(tmp.name, 'perilla-gh-pages'), FRONTEND_PATH)
  console.log('🎉 OK')
}

commander
  .command('frontend')
  .description('Frontend utils')
  .option('-u, --update', 'Update frontend files')
  .option('-r, --remove', 'Remove frontend files')
  .action(async (cmd) => {
    try {
      if (cmd.update) {
        await updateFrontend()
      }
      if (cmd.remove) {
        await removeFrontend()
      }
    } catch (e) {
      console.log(e.message)
    }
    const { gracefulExit } = require('./utils')
    gracefulExit('cli finished')
  })

commander.parse(process.argv)
