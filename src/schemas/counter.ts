import { Document, model, Schema } from 'mongoose'

export interface ICounterModel extends Document {
    _id: string;
    count: number;
}

export const CounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true,
      default: 0
    }
  }
)

export const FileCounter = model<ICounterModel>('filecounter', CounterSchema)
export const SolutionCounter = model<ICounterModel>('solutioncounter', CounterSchema)
export const ProblemCounter = model<ICounterModel>('problemcounter', CounterSchema)
export const ArticleCounter = model<ICounterModel>('articlecounter', CounterSchema)
