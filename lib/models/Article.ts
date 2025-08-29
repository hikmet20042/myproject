import mongoose from 'mongoose'

interface IArticle extends mongoose.Document {
  title: string
  content: any // BlockNote JSON
  abstract?: string
  authorName?: string | null
  userId?: mongoose.Types.ObjectId | string | null // Add userId for associating drafts with users
  category: string
  tags: string[]
  references?: string[]
  isAnonymous?: boolean
  media?: Array<{
    type: string;
    url: string;
    alt?: string;
    blobId?: mongoose.Types.ObjectId; // Reference to ImageBlob
  }>
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  publishedAt?: Date
  views: number
  likes: number
  uniqueViews: number
  viewedBy: mongoose.Types.ObjectId[]
  likedBy: mongoose.Types.ObjectId[]
  shares: number
  readTime: number // Average reading time in seconds
  engagementScore: number // Calculated engagement metric
  slug?: string
  metaDescription?: string
  featuredImage?: string // Legacy field
  featuredImageBlobId?: mongoose.Types.ObjectId // Reference to ImageBlob
  adminComment?: string
  // Enhanced draft management fields
  draftMetadata?: {
    folder?: string
    completionPercentage?: number
    estimatedReadTime?: number
    wordCount?: number
    lastEditedSection?: string
    collaborators?: string[]
    isTemplate?: boolean
    templateName?: string
    notes?: string
    reminders?: Array<{ date: Date; message: string; completed: boolean }>
    // Inactivity tracking
    lastActivity?: Date
    inactivityWarningsSent?: number
    scheduledDeletionDate?: Date
    isMarkedForDeletion?: boolean
    deletionGracePeriod?: Date
  }

  // Fields for scraped news articles
  summary?: string
  source?: string
  sourceUrl?: string
  date?: Date
  scrapedAt?: Date
  contentLength?: number
}

const ArticleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    // Removed index: true - using compound indexes instead for better performance
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // BlockNote JSON
    required: true,
  },
  abstract: {
    type: String,
    required: false,
    trim: true,
  },
  authorName: {
    type: String, // Store as string to avoid ObjectId casting issues
    required: false,
    default: null,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
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
      blobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ImageBlob',
        required: false
      }
    }
  ],
  tags: [{
    type: String,
    trim: true,
  }],
  references: [{
    type: String,
    trim: true,
  }],
  imageUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
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
  uniqueViews: {
    type: Number,
    default: 0,
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  shares: {
    type: Number,
    default: 0,
  },
  readTime: {
    type: Number,
    default: 0, // in seconds
  },
  engagementScore: {
    type: Number,
    default: 0,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  featuredImage: {
    type: String, // Legacy field
  },
  featuredImageBlobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageBlob',
    required: false
  },
  adminComment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Enhanced draft management fields
  draftMetadata: {
    folder: { type: String, default: 'General' },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    estimatedReadTime: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    lastEditedSection: { type: String },
    collaborators: [{ type: String }],
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String },
    notes: { type: String },
    reminders: [{
      date: { type: Date },
      message: { type: String },
      completed: { type: Boolean, default: false }
    }],
    // Inactivity tracking fields
    lastActivity: { type: Date, default: Date.now },
    inactivityWarningsSent: { type: Number, default: 0 },
    scheduledDeletionDate: { type: Date },
    isMarkedForDeletion: { type: Boolean, default: false },
    deletionGracePeriod: { type: Date }
  },

}, {
  timestamps: true,
})

// Enhanced indexes for better search and filtering performance
ArticleSchema.index({ title: 'text', content: 'text', abstract: 'text' })
ArticleSchema.index({ category: 1 })
ArticleSchema.index({ status: 1 })
ArticleSchema.index({ publishedAt: -1 })
ArticleSchema.index({ userId: 1, status: 1 })
ArticleSchema.index({ 'draftMetadata.folder': 1 })

ArticleSchema.index({ 'draftMetadata.isTemplate': 1 })
ArticleSchema.index({ 'draftMetadata.lastActivity': 1 })
ArticleSchema.index({ 'draftMetadata.scheduledDeletionDate': 1 })
ArticleSchema.index({ 'draftMetadata.isMarkedForDeletion': 1 })
ArticleSchema.index({ updatedAt: -1 })
ArticleSchema.index({ createdAt: -1 })
// Analytics indexes - removed duplicate single field indexes (already defined in schema with index: true)
// Keeping only compound indexes for better query performance
// Removed duplicate slug index - already defined in schema with index: true
ArticleSchema.index({ userId: 1, views: -1 })
ArticleSchema.index({ userId: 1, likes: -1 })
ArticleSchema.index({ status: 1, publishedAt: -1 })

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema)
