import { Document, Model, model, Schema } from 'mongoose'
import { join, resolve } from 'path'
import { FILE, STORE_PATH } from '../constant'
import { getFileSize } from '../utils'
import { FileCounter } from './counter'

export interface IFileModel extends Document {
    id: number;
    name: string;
    type: string;
    description: string;
    hash: string;
    size: number;
    updated: Date;
    tags: string[];
    owner: string;
    creator: string;
    getPath(): string;
    setFile(path: string): Promise<void>;
}

export const FileSchema = new Schema(
  {
    id: Number,
    name: {
      type: String,
      required: true,
      minlength: FILE.title.minlength,
      maxlength: FILE.title.maxlength
    },
    type: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
      default: FILE.description.default,
      minlength: FILE.description.minlength,
      maxlength: FILE.description.maxlength
    },
    hash: String,
    size: String,
    tags: {
      type: [String],
      required: true,
      default: FILE.tags.default
    },
    updated: Date,
    owner: {
      type: String,
      required: true
    },
    creator: {
      type: String,
      required: true
    }
  }
)

FileSchema.index({ id: 1, owner: 1 }, { unique: true })

FileSchema.methods.getPath = function () {
  const self = this as IFileModel
  return resolve(join(STORE_PATH, self.hash))
}

FileSchema.methods.setFile = async function (hash: string) {
  const self = this as IFileModel
  self.hash = hash
  self.size = await getFileSize(self.getPath())
}

FileSchema.pre('save', async function (next) {
  const self = this as IFileModel
  if (!self.id) {
    const counter = await FileCounter.findByIdAndUpdate(self.owner, { $inc: { count: 1 } }, { upsert: true, new: true })
    self.id = counter.count
  }
  self.updated = new Date()
  return next()
})

export const File: Model<IFileModel> = model<IFileModel>('File', FileSchema)
