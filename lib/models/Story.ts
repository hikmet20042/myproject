import mongoose from 'mongoose';

interface IStory extends mongoose.Document {
  title: string;
  content: any; // BlockNote JSON
  author?: mongoose.Types.ObjectId | null;
  authorName?: string;
  tags: string[];
  abstract?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  isAnonymous?: boolean;
  media?: Array<{ type: string; url: string; alt?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new mongoose.Schema<IStory>({
  title: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // BlockNote JSON
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  authorName: { type: String, required: false },
  tags: [{ type: String }],
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
    }
  ],
}, { timestamps: true });

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
