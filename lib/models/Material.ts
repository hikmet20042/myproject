import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  description: string;
  category: 'toolkit' | 'course' | 'video' | 'guide' | 'document' | 'emergency' | 'other';
  type: string; // e.g., "Free Course", "Certification", "PDF Guide", etc.
  url: string;
  imageUrl?: string;
  provider?: string; // e.g., "Coursera", "UN Women", "WHO"
  duration?: string; // e.g., "4 weeks", "2 hours"
  language?: string[];
  tags?: string[];
  featured?: boolean;
  isPublished: boolean;
  order: number; // For custom ordering
  views?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Material description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['toolkit', 'course', 'video', 'guide', 'document', 'emergency', 'other'],
      default: 'other'
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: [true, 'Material URL is required'],
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    provider: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    },
    language: {
      type: [String],
      default: ['English']
    },
    tags: {
      type: [String],
      default: []
    },
    featured: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
MaterialSchema.index({ category: 1, isPublished: 1, order: 1 });
MaterialSchema.index({ featured: 1, isPublished: 1 });
MaterialSchema.index({ createdAt: -1 });

const Material: Model<IMaterial> = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;
