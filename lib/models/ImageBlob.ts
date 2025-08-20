import mongoose from 'mongoose';

interface IImageBlob extends mongoose.Document {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  data: Buffer;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  description?: string;
  alt?: string;
  tags?: string[];
  // Usage tracking
  usageCount: number;
  lastAccessed: Date;
  // Image metadata
  width?: number;
  height?: number;
  // Compression info
  isCompressed: boolean;
  originalSize?: number;

  // Processing metadata
  metadata?: {
    originalMimetype?: string; // Original format before optimization
    wasOptimized?: boolean; // Whether image was optimized for web
    wasCompressed?: boolean; // Whether image was compressed
    wasRotated?: boolean; // Whether image was auto-rotated
    processingSteps?: string[]; // List of processing steps applied
    variants?: {
      thumbnail?: string; // URL or ID of thumbnail variant
      medium?: string; // URL or ID of medium variant
      responsive?: Array<{ width: number; id: string }>; // Responsive variants
    };
    // Image characteristics
    format?: string; // Original format detected by Sharp
    space?: string; // Color space
    channels?: number; // Number of channels
    depth?: string; // Bit depth
    density?: number; // DPI
    hasProfile?: boolean; // Has color profile
    hasAlpha?: boolean; // Has transparency
    isAnimated?: boolean; // Is animated (GIF, WebP)
    // EXIF data (sanitized)
    exif?: {
      make?: string;
      model?: string;
      dateTime?: string;
      software?: string;
      orientation?: number;
      xResolution?: number;
      yResolution?: number;
      resolutionUnit?: number;
      // GPS data removed for privacy by default
    };
  };
}

const ImageBlobSchema = new mongoose.Schema<IImageBlob>({
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  },
  size: {
    type: Number,
    required: true,
    max: 10 * 1024 * 1024 // 10MB limit
  },
  data: {
    type: Buffer,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  alt: {
    type: String,
    maxlength: 200
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  width: {
    type: Number,
    min: 1
  },
  height: {
    type: Number,
    min: 1
  },
  isCompressed: {
    type: Boolean,
    default: false
  },
  originalSize: {
    type: Number,
    min: 0
  },
  metadata: {
    originalMimetype: String,
    wasOptimized: {
      type: Boolean,
      default: false
    },
    wasCompressed: {
      type: Boolean,
      default: false
    },
    wasRotated: {
      type: Boolean,
      default: false
    },
    processingSteps: [{
      type: String
    }],
    variants: {
      thumbnail: String,
      medium: String,
      responsive: [{
        width: Number,
        id: String
      }]
    },
    // Image characteristics
    format: String,
    space: String,
    channels: Number,
    depth: String,
    density: Number,
    hasProfile: Boolean,
    hasAlpha: Boolean,
    isAnimated: Boolean,
    // EXIF data (sanitized)
    exif: {
      make: String,
      model: String,
      dateTime: String,
      software: String,
      orientation: Number,
      xResolution: Number,
      yResolution: Number,
      resolutionUnit: Number
    }
  }
}, {
  timestamps: true,
  collection: 'imageblobs'
});

// Indexes for performance
ImageBlobSchema.index({ uploadedBy: 1, uploadedAt: -1 });
ImageBlobSchema.index({ mimetype: 1 });
ImageBlobSchema.index({ size: 1 });
ImageBlobSchema.index({ usageCount: -1 });

// Static methods
ImageBlobSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId, options: {
  limit?: number;
  skip?: number;
  mimetype?: string;
} = {}) {
  const query: any = { uploadedBy: userId };
  if (options.mimetype) {
    query.mimetype = options.mimetype;
  }
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
    .select('-data'); // Exclude binary data for listing
};

ImageBlobSchema.statics.getImageWithData = function(imageId: string | mongoose.Types.ObjectId) {
  return this.findById(imageId);
};

ImageBlobSchema.statics.incrementUsage = function(imageId: string | mongoose.Types.ObjectId) {
  return this.findByIdAndUpdate(
    imageId,
    { 
      $inc: { usageCount: 1 },
      $set: { lastAccessed: new Date() }
    },
    { new: true }
  );
};

ImageBlobSchema.statics.cleanupUnusedImages = function(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    usageCount: 0,
    uploadedAt: { $lt: cutoffDate }
  });
};

// Instance methods
ImageBlobSchema.methods.getPublicUrl = function() {
  return `/api/images/${this._id}`;
};

ImageBlobSchema.methods.getMetadata = function() {
  return {
    id: this._id,
    filename: this.filename,
    originalName: this.originalName,
    mimetype: this.mimetype,
    size: this.size,
    width: this.width,
    height: this.height,
    uploadedAt: this.uploadedAt,
    url: this.getPublicUrl()
  };
};

// Interface for static methods
interface IImageBlobModel extends mongoose.Model<IImageBlob> {
  findByUser(
    userId: mongoose.Types.ObjectId, 
    options?: {
      limit?: number;
      skip?: number;
      mimetype?: string;
    }
  ): mongoose.Query<IImageBlob[], IImageBlob>;
  
  getImageWithData(imageId: string | mongoose.Types.ObjectId): mongoose.Query<IImageBlob | null, IImageBlob>;
  
  incrementUsage(imageId: string | mongoose.Types.ObjectId): mongoose.Query<IImageBlob | null, IImageBlob>;
  
  cleanupUnusedImages(daysOld?: number): mongoose.Query<any, IImageBlob>;
}

export default (mongoose.models.ImageBlob || mongoose.model<IImageBlob>('ImageBlob', ImageBlobSchema)) as IImageBlobModel;
export type { IImageBlob };
