import { Document, Model, model, Schema } from 'mongoose'
import { SolutionCounter } from './counter'
import { Task } from './task'

export enum SolutionResult {
    WaitingJudge, // Wating Judge
    Judging, // Judging
    Skipped, // Skipped
    Accepted, // Accepted
    WrongAnswer, // Wrong Answer
    TimeLimitExceeded, // Time Limit Exceeded
    MemoryLimitExceeded, // Memory Limit Exceeded
    RuntimeError, // Runtime Error
    CompileError, // Compile Error
    PresentationError, // Presentation Error
    JudgementFailed, // Judgement Failed (Judge program error)
    SystemError, // System Error     (Judge framwork & Judge plugin error)
    OtherError, // Other Error
}

export interface ISolutionModel extends Document {
    id: number;
    problem: number;
    status: SolutionResult;
    score: number;
    data?: object;
    details?: object;
    updated: Date;
    owner: string;
    creator: string;
}

export const SolutionSchema: Schema = new Schema(
  {
    id: Number,
    problem: {
      type: Number,
      required: true
    },
    status: {
      type: Number,
      required: true,
      default: SolutionResult.WaitingJudge,
      validate: (x: number) => !!SolutionResult[x]
    },
    score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100
    },
    data: Object,
    details: Object,
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
SolutionSchema.index({ id: 1, owner: 1 }, { unique: true })

SolutionSchema.pre('save', async function (next) {
  const self = this as ISolutionModel
  if (!self.id) {
    const counter = await SolutionCounter.findByIdAndUpdate(self.owner, { $inc: { count: 1 } }, { upsert: true, new: true })
    self.id = counter.count
    self.status = SolutionResult.WaitingJudge
  }
  self.updated = new Date()
  return next()
})

SolutionSchema.pre('remove', async function (next) {
  const self = this as ISolutionModel
  await Task.remove({ objectID: self._id })
  return next()
})

export const Solution: Model<ISolutionModel> = model<ISolutionModel>('Solution', SolutionSchema)
