import mongoose from 'mongoose';

export interface ISubmission extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'blog' | 'article';
  title: string;
  content: string;
  contentHtml: string;
  tags: string[];
  abstract?: string;
  references?: string[];
  isAnonymous?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new mongoose.Schema<ISubmission>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['blog', 'article'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  contentHtml: { type: String, required: true },
  tags: [{ type: String }],
  abstract: String,
  references: [{ type: String }],
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminComment: String,
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
