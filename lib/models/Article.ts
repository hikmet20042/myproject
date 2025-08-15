import mongoose from 'mongoose'

interface IArticle extends mongoose.Document {
  title: string
  content: any // BlockNote JSON
  author: mongoose.Types.ObjectId
  category: string
  tags: string[]
  media?: Array<{ type: string; url: string; alt?: string }>
  status: 'pending' | 'approved' | 'rejected'
  publishedAt?: Date
  views: number
  likes: number
  // Fields for scraped news articles
  summary?: string
  source?: string
  sourceUrl?: string
  date?: Date
  scrapedAt?: Date
  contentLength?: number
}

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // BlockNote JSON
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: [
    {
      type: {
        type: String, // 'image', 'embed', etc.
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      alt: String,
    }
  ],
  tags: [{
    type: String,
    trim: true,
  }],
  imageUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Index for better search performance
ArticleSchema.index({ title: 'text', content: 'text' })
ArticleSchema.index({ category: 1 })
ArticleSchema.index({ status: 1 })
ArticleSchema.index({ publishedAt: -1 })

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema)
