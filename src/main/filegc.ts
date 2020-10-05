import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { STORE_PATH } from '../constant'
import { log } from '../log'
import { File } from '../schemas/file'

export const HandleFileGC = (hash: string) => {
  const path = join(STORE_PATH, hash)
  if (!existsSync(path)) { return }
  File.findOne({ hash }).then((file) => {
    if (!file) {
      log('Removing ' + path)
      unlinkSync(path)
    }
  }).catch((e) => {
    log(e.message)
  })
}
