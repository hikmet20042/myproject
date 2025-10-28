import mongoose from 'mongoose';

interface IUserAnalytics extends mongoose.Document {
  userId: mongoose.Types.ObjectId;

  // Writing statistics

  totalBlogs: number;
  publishedContent: number;

  // Engagement metrics
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  avgEngagementRate: number;

  // Writing productivity
  totalWordCount: number;

  writingStreak: number; // consecutive days with activity
  longestStreak: number;
  lastActiveDate: Date;

  // Content performance

  topPerformingTags: string[];
  preferredCategories: string[];

  // Time-based analytics
  dailyStats: Array<{
    date: Date;

    wordsWritten: number;
    timeSpent: number; // in minutes
  }>;

  weeklyStats: Array<{
    weekStart: Date;

    totalViews: number;
    totalLikes: number;
    avgEngagement: number;
  }>;

  monthlyStats: Array<{
    month: Date;
    contentPublished: number;
    totalEngagement: number;
    growthRate: number;
  }>;

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
  publishedContent: { type: Number, default: 0 },

  // Engagement metrics
  totalViews: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  totalShares: { type: Number, default: 0 },
  avgEngagementRate: { type: Number, default: 0 },

  // Writing productivity
  totalWordCount: { type: Number, default: 0 },
  writingStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },

  // Content performance
  topPerformingTags: [{ type: String }],
  preferredCategories: [{ type: String }],

  // Time-based analytics
  dailyStats: [{
    date: { type: Date, required: true },
    wordsWritten: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
  }],

  weeklyStats: [{
    weekStart: { type: Date, required: true },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    avgEngagement: { type: Number, default: 0 },
  }],

  monthlyStats: [{
    month: { type: Date, required: true },
    contentPublished: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
  }],

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
  // Automatically remove old daily stats (keep last 90 days)
  // This would be handled by a background job in production
});

// Indexes for efficient queries
// userId index not needed - already unique
UserAnalyticsSchema.index({ productivityScore: -1 });
UserAnalyticsSchema.index({ totalViews: -1 });
UserAnalyticsSchema.index({ totalLikes: -1 });
UserAnalyticsSchema.index({ writingStreak: -1 });
UserAnalyticsSchema.index({ lastActiveDate: -1 });
UserAnalyticsSchema.index({ 'dailyStats.date': -1 });
UserAnalyticsSchema.index({ 'weeklyStats.weekStart': -1 });
UserAnalyticsSchema.index({ 'monthlyStats.month': -1 });

// Static methods for analytics calculations
UserAnalyticsSchema.statics.calculateProductivityScore = function (analytics: any) {
  const {

    totalBlogs = 0,
    writingStreak = 0,
    avgEngagementRate = 0,
    totalWordCount = 0
  } = analytics;

  // Weighted scoring system (0-100)
  const contentScore = Math.min(30, totalBlogs * 3);
  const consistencyScore = Math.min(20, writingStreak * 2);
  const engagementScore = Math.min(15, avgEngagementRate * 15);
  const volumeScore = Math.min(10, totalWordCount / 1000);

  return Math.round(contentScore + consistencyScore + engagementScore + volumeScore);
};

// Method to update daily stats
UserAnalyticsSchema.methods.updateDailyStats = function (date: Date, stats: any) {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const existingIndex = this.dailyStats.findIndex((stat: any) =>
    stat.date.getTime() === today.getTime()
  );

  if (existingIndex >= 0) {
    // Update existing stats
    Object.assign(this.dailyStats[existingIndex], stats);
  } else {
    // Add new daily stats
    this.dailyStats.push({ date: today, ...stats });

    // Keep only last 90 days
    this.dailyStats = this.dailyStats
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
      .slice(0, 90);
  }
};

export default mongoose.models.UserAnalytics || mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);
