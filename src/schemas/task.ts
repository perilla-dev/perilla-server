import { Document, model, Schema } from 'mongoose'

export interface ITaskModel extends Document {
    problem: object;
    solution: object;
    objectID: string;
    priority: number;
    owner: string;
    creator: string;
    channel: string;
}

export const TaskSchema = new Schema(
  {
    problem: Object,
    solution: Object,
    objectID: String,
    priority: Number,
    owner: String,
    creator: String,
    channel: String
  }
)
TaskSchema.index({ priority: 1 })

TaskSchema.pre('save', async function (next) {
  const self = this as ITaskModel
  // Task will be create and save only once
  // So just safely remove all exist task (<=1) with same oid
  await Task.remove({ objectID: self.objectID })
  return next()
})

export const Task = model<ITaskModel>('task', TaskSchema)
