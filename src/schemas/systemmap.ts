import { Document, model, Schema } from 'mongoose'

export interface ISystemMapModel extends Document {
    user: string;
}

export const SystemMapSchema = new Schema(
  {
    user: {
      type: String,
      required: true,
      unique: true
    }
  }
)

export const SystemMap = model<ISystemMapModel>('systemmap', SystemMapSchema)
