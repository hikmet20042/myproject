import mongoose from 'mongoose';

interface IUserAnalytics extends mongoose.Document {
  userId: mongoose.Types.ObjectId;

  // Writing statistics
  totalBlogs: number;

  // Engagement metrics
  totalViews: number;
  totalLikes: number;
  avgEngagementRate: number;

  // Writing productivity
  writingStreak: number; // consecutive days with activity
  lastActiveDate: Date;

  // Achievement tracking
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: 'writing' | 'engagement' | 'consistency' | 'milestone';
  }>;

  // Productivity score (0-100)
  productivityScore: number;
  lastCalculated: Date;
}

const UserAnalyticsSchema = new mongoose.Schema<IUserAnalytics>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Writing statistics
  totalBlogs: { type: Number, default: 0 },

  // Engagement metrics
  totalViews: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  avgEngagementRate: { type: Number, default: 0 },

  // Writing productivity
  writingStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },

  // Achievement tracking
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    category: {
      type: String,
      enum: ['writing', 'engagement', 'consistency', 'milestone'],
      required: true
    },
  }],

  // Productivity score
  productivityScore: { type: Number, default: 0, min: 0, max: 100 },
  lastCalculated: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Indexes for efficient queries
// userId index not needed - already unique
UserAnalyticsSchema.index({ productivityScore: -1 });
UserAnalyticsSchema.index({ totalViews: -1 });
UserAnalyticsSchema.index({ totalLikes: -1 });
UserAnalyticsSchema.index({ writingStreak: -1 });
UserAnalyticsSchema.index({ lastActiveDate: -1 });

// Static methods for analytics calculations
UserAnalyticsSchema.statics.calculateProductivityScore = function (analytics: any) {
  const {
    totalBlogs = 0,
    writingStreak = 0,
    avgEngagementRate = 0
  } = analytics;

  // Weighted scoring system (0-100)
  const contentScore = Math.min(40, totalBlogs * 4); // Increased weight
  const consistencyScore = Math.min(30, writingStreak * 3); // Increased weight
  const engagementScore = Math.min(30, avgEngagementRate * 30); // Increased weight

  return Math.round(contentScore + consistencyScore + engagementScore);
};

export default mongoose.models.UserAnalytics || mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);
