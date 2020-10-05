import { pbkdf2Sync, randomBytes } from 'crypto'
import { Document, model, Schema } from 'mongoose'
import { ENTRY } from '../constant'
import { Article } from './article'
import { ArticleCounter, FileCounter, ProblemCounter, SolutionCounter } from './counter'
import { EntryMap } from './entrymap'
import { File } from './file'
import { Problem } from './problem'
import { Solution } from './solution'
import { SystemMap } from './systemmap'

export enum EntryType {
    user,
    group,
}

export interface IEntryModel extends Document {
    _id: string;
    description?: string;
    email: string;
    hash?: string;
    salt?: string;
    created: Date;
    type: EntryType;
    setPassword(password: string): string;
    validPassword(password: string): boolean;
}

export const EntrySchema: Schema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      minlength: ENTRY._id.minlength,
      maxlength: ENTRY._id.maxlength,
      validate: ENTRY._id.validate
    },
    description: String,
    email: {
      type: String,
      required: true,
      unique: true,
      minlength: ENTRY.email.minlength,
      maxlength: ENTRY.email.maxlength,
      validate: ENTRY.email.validate
    },
    hash: String,
    salt: String,
    created: Date,
    type: {
      type: Number,
      required: true,
      validate: (v: number) => !!EntryType[v]
    }
  }
)

EntrySchema.methods.setPassword = function (password: string) {
  if (this.type === EntryType.user) {
    this.salt = randomBytes(16).toString('hex')
    this.hash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex')
  } else {
    throw new Error('Entry not a user')
  }
}

EntrySchema.methods.validPassword = function (password: string) {
  if (this.type === EntryType.user) {
    const hash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex')
    return this.hash === hash
  } else {
    throw new Error('Entry not a user')
  }
}

EntrySchema.pre('save', async function (next) {
  const self = this as IEntryModel
  if (!self.created) {
    self.created = new Date()
    if (self.type === EntryType.user) {
      // Add self entry-map
      const map = new EntryMap()
      map.from = map.to = self._id
      map.admin = true
      await map.save()
    }
  }
  return next()
})

EntrySchema.pre('remove', async function (next) {
  const self = this as IEntryModel
  await ArticleCounter.remove({ _id: self._id })
  await FileCounter.remove({ _id: self._id })
  await SolutionCounter.remove({ _id: self._id })
  await ProblemCounter.remove({ _id: self._id })
  await Article.remove({ $or: [{ owner: self._id }, { creator: self._id }] })
  await EntryMap.remove({ $or: [{ from: self._id }, { to: self._id }] })
  await File.remove({ $or: [{ owner: self._id }, { creator: self._id }] })
  await Problem.remove({ $or: [{ owner: self._id }, { creator: self._id }] })
  await Solution.remove({ $or: [{ owner: self._id }, { creator: self._id }] })
  await SystemMap.remove({ user: self._id })
  return next()
})

export const Entry = model<IEntryModel>('Entry', EntrySchema)
