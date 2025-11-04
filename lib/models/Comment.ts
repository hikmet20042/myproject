import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
  blogId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId | null;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  dislikes: number;
  dislikedBy: mongoose.Types.ObjectId[];
  isAuthor: boolean; // True if commenter is the blog author
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new mongoose.Schema<IComment>({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: {
    type: Number,
    default: 0
  },
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAuthor: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for better query performance
CommentSchema.index({ blogId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ authorId: 1 });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
