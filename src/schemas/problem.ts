import { Document, Model, model, Schema } from 'mongoose'
import { PROBLEM } from '../constant'
import { ProblemCounter } from './counter'
import { Solution } from './solution'

export interface IProblemModel extends Document {
    id: number;
    title: string;
    content: string;
    data?: object;
    channel?: string;
    tags: string[];
    updated: Date;
    owner: string;
    creator: string;
}

export const ProblemSchema: Schema = new Schema(
  {
    id: Number,
    title: {
      type: String,
      required: true,
      minlength: PROBLEM.title.minlength,
      maxlength: PROBLEM.title.maxlength
    },
    content: {
      type: String,
      required: true,
      default: PROBLEM.content.default,
      minlength: PROBLEM.content.minlength,
      maxlength: PROBLEM.content.maxlength
    },
    data: Object,
    channel: String,
    tags: {
      type: [String],
      required: true,
      default: PROBLEM.tags.default
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
ProblemSchema.index({ id: 1, owner: 1 }, { unique: true })
ProblemSchema.pre('save', async function (next) {
  const self = this as IProblemModel
  if (!self.id) {
    const counter = await ProblemCounter.findByIdAndUpdate(self.owner, { $inc: { count: 1 } }, { upsert: true, new: true })
    self.id = counter.count
  }
  self.updated = new Date()
  return next()
})

ProblemSchema.pre('remove', async function (next) {
  await Solution.remove({ problem: this.id })
  return next()
})

export const Problem: Model<IProblemModel> = model<IProblemModel>('Problem', ProblemSchema)
