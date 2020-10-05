import { Document, Model, model, Schema } from 'mongoose'
import { ARTICLE } from '../constant'
import { ArticleCounter } from './counter'

export interface IArticleModel extends Document {
    id: number;
    title: string;
    content: string;
    tags: string[];
    updated: Date;
    owner: string;
    creator: string;
}

export const ArticleSchema: Schema = new Schema(
  {
    id: Number,
    title: {
      type: String,
      required: true,
      minlength: ARTICLE.title.minlength,
      maxlength: ARTICLE.title.maxlength
    },
    content: {
      type: String,
      required: true,
      default: ARTICLE.content.default,
      minlength: ARTICLE.content.minlength,
      maxlength: ARTICLE.content.maxlength
    },
    tags: {
      type: [String],
      required: true,
      default: ARTICLE.tags.default
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
ArticleSchema.index({ id: 1, owner: 1 }, { unique: true })
ArticleSchema.pre('save', async function (next) {
  const self = this as IArticleModel
  if (!self.id) {
    const counter = await ArticleCounter.findByIdAndUpdate(self.owner, { $inc: { count: 1 } }, { upsert: true, new: true })
    self.id = counter.count
  }
  self.updated = new Date()
  return next()
})

export const Article: Model<IArticleModel> = model<IArticleModel>('Article', ArticleSchema)
