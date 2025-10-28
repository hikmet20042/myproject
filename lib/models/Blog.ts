import mongoose from 'mongoose';

interface IBlog extends mongoose.Document {
  title: string;
  content: any; // BlockNote JSON
  author?: mongoose.Types.ObjectId | null;
  authorName?: string;
  abstract?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  isAnonymous?: boolean;
  media?: Array<{
    type: string;
    url: string;
    alt?: string;
    blobId?: mongoose.Types.ObjectId; // Reference to ImageBlob
  }>;

  // Analytics and engagement fields
  views: number;
  uniqueViews: number;
  viewedBy: mongoose.Types.ObjectId[];
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  shares: number;
  readTime: number;
  engagementScore: number;
  slug?: string;
  metaDescription?: string;
  featuredImage?: string; // Legacy field
  featuredImageBlobId?: mongoose.Types.ObjectId; // Reference to ImageBlob

  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new mongoose.Schema<IBlog>({
  title: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // BlockNote JSON
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  authorName: { type: String, required: false },
  abstract: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminComment: String,
  isAnonymous: { type: Boolean, default: false },
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

  // Analytics and engagement fields
  views: {
    type: Number,
    default: 0,
    // Removed index: true - using compound indexes instead
  },
  uniqueViews: {
    type: Number,
    default: 0,
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likes: {
    type: Number,
    default: 0,
    // Removed index: true - using compound indexes instead
  },
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
    default: 0,
  },
  engagementScore: {
    type: Number,
    default: 0,
    // Removed index: true - using compound indexes instead
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
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
}, { timestamps: true });

// Add indexes for analytics
BlogSchema.index({ views: -1 });
BlogSchema.index({ likes: -1 });
BlogSchema.index({ engagementScore: -1 });
BlogSchema.index({ author: 1, views: -1 });
BlogSchema.index({ author: 1, likes: -1 });
BlogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
