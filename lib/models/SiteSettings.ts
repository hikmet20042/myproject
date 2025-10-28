import mongoose from 'mongoose';

interface ISiteSettings extends mongoose.Document {
  // Site Configuration
  siteInfo: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logoUrl?: string;
    faviconUrl?: string;
    contactEmail: string;
    supportEmail: string;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
  };

  // Content Policies
  contentPolicies: {
    requireApproval: boolean;
    autoApproveVerifiedUsers: boolean;
    maxArticleLength: number;
    maxStoryLength: number;
    allowedFileTypes: string[];
    maxFileSize: number; // in MB
    moderationKeywords: string[];
    bannedWords: string[];
    enableProfanityFilter: boolean;
    enableSpamDetection: boolean;
  };

  // User Management
  userManagement: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: 'user' | 'contributor';
    maxUsersPerDay: number;
    enableUserSuspension: boolean;
    suspensionReasons: string[];
    enableUserDeletion: boolean;
    dataRetentionDays: number;
  };

  // Notification Settings
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    emailProvider: 'smtp' | 'sendgrid' | 'mailgun';
    emailConfig: {
      host?: string;
      port?: number;
      secure?: boolean;
      username?: string;
      password?: string;
      apiKey?: string;
    };
    defaultNotificationSettings: {
      articleApproved: boolean;
      articleRejected: boolean;
      newFollower: boolean;
      systemUpdates: boolean;
    };
  };

  // Security Settings
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    enableCaptcha: boolean;
    captchaProvider: 'recaptcha' | 'hcaptcha';
    captchaConfig: {
      siteKey?: string;
      secretKey?: string;
    };
    enableRateLimit: boolean;
    rateLimitConfig: {
      windowMs: number;
      maxRequests: number;
    };
  };

  // Analytics & Monitoring
  analytics: {
    enableGoogleAnalytics: boolean;
    googleAnalyticsId?: string;
    enableHotjar: boolean;
    hotjarId?: string;
    enableErrorTracking: boolean;
    errorTrackingProvider: 'sentry' | 'bugsnag';
    errorTrackingConfig: {
      dsn?: string;
      apiKey?: string;
    };
  };

  // Performance Settings
  performance: {
    enableCaching: boolean;
    cacheTimeout: number; // in seconds
    enableCompression: boolean;
    enableCDN: boolean;
    cdnUrl?: string;
    enableImageOptimization: boolean;
    imageQuality: number; // 1-100
  };

  // Backup & Maintenance
  maintenance: {
    enableMaintenanceMode: boolean;
    maintenanceMessage?: string;
    enableAutomaticBackups: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetentionDays: number;
    enableDatabaseOptimization: boolean;
    optimizationSchedule: string; // cron expression
  };

  // Feature Flags
  features: {
    enableComments: boolean;
    enableLikes: boolean;
    enableSharing: boolean;
    enableBookmarks: boolean;
    enableFollowing: boolean;
    enableCollaboration: boolean;
    enableVersioning: boolean;
    enableAI: boolean;
    enableTranslation: boolean;
  };

  // API Settings
  api: {
    enablePublicAPI: boolean;
    requireAPIKey: boolean;
    rateLimitPerHour: number;
    enableWebhooks: boolean;
    webhookEndpoints: {
      url: string;
      events: string[];
      secret?: string;
    }[];
  };

  // Metadata
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
  version: string;
}

const SiteSettingsSchema = new mongoose.Schema<ISiteSettings>({
  siteInfo: {
    siteName: { type: String, required: true, default: 'Social Justice Platform' },
    siteDescription: { type: String, required: true, default: 'Platform for social justice advocacy and community empowerment' },
    siteUrl: { type: String, required: true, default: 'https://genderequality.az' },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    contactEmail: { type: String, required: true, default: 'contact@genderequality.az' },
    supportEmail: { type: String, required: true, default: 'support@genderequality.az' },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      youtube: { type: String },
    },
  },

  contentPolicies: {
    requireApproval: { type: Boolean, default: true },
    autoApproveVerifiedUsers: { type: Boolean, default: false },
    maxArticleLength: { type: Number, default: 50000 }, // characters
    maxStoryLength: { type: Number, default: 10000 }, // characters
    allowedFileTypes: [{ type: String, default: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'] }],
    maxFileSize: { type: Number, default: 10 }, // MB
    moderationKeywords: [{ type: String }],
    bannedWords: [{ type: String }],
    enableProfanityFilter: { type: Boolean, default: true },
    enableSpamDetection: { type: Boolean, default: true },
  },

  userManagement: {
    allowRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    defaultUserRole: { type: String, enum: ['user', 'contributor'], default: 'user' },
    maxUsersPerDay: { type: Number, default: 100 },

    enableUserDeletion: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 365 },
  },

  notifications: {
    enableEmailNotifications: { type: Boolean, default: true },
    enablePushNotifications: { type: Boolean, default: false },
    emailProvider: { type: String, enum: ['smtp', 'sendgrid', 'mailgun'], default: 'smtp' },
    emailConfig: {
      host: { type: String },
      port: { type: Number },
      secure: { type: Boolean },
      username: { type: String },
      password: { type: String },
      apiKey: { type: String },
    },
    defaultNotificationSettings: {
      articleApproved: { type: Boolean, default: true },
      articleRejected: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
    },
  },

  security: {
    enableTwoFactor: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 1440 }, // 24 hours
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 15 }, // minutes
    enableCaptcha: { type: Boolean, default: false },
    captchaProvider: { type: String, enum: ['recaptcha', 'hcaptcha'], default: 'recaptcha' },
    captchaConfig: {
      siteKey: { type: String },
      secretKey: { type: String },
    },
    enableRateLimit: { type: Boolean, default: true },
    rateLimitConfig: {
      windowMs: { type: Number, default: 900000 }, // 15 minutes
      maxRequests: { type: Number, default: 100 },
    },
  },

  analytics: {
    enableGoogleAnalytics: { type: Boolean, default: false },
    googleAnalyticsId: { type: String },
    enableHotjar: { type: Boolean, default: false },
    hotjarId: { type: String },
    enableErrorTracking: { type: Boolean, default: true },
    errorTrackingProvider: { type: String, enum: ['sentry', 'bugsnag'], default: 'sentry' },
    errorTrackingConfig: {
      dsn: { type: String },
      apiKey: { type: String },
    },
  },

  performance: {
    enableCaching: { type: Boolean, default: true },
    cacheTimeout: { type: Number, default: 3600 }, // 1 hour
    enableCompression: { type: Boolean, default: true },
    enableCDN: { type: Boolean, default: false },
    cdnUrl: { type: String },
    enableImageOptimization: { type: Boolean, default: true },
    imageQuality: { type: Number, default: 80, min: 1, max: 100 },
  },

  maintenance: {
    enableMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'Site is under maintenance. Please check back later.' },
    enableAutomaticBackups: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    backupRetentionDays: { type: Number, default: 30 },
    enableDatabaseOptimization: { type: Boolean, default: true },
    optimizationSchedule: { type: String, default: '0 2 * * 0' }, // Weekly at 2 AM Sunday
  },

  features: {
    enableComments: { type: Boolean, default: true },
    enableLikes: { type: Boolean, default: true },
    enableSharing: { type: Boolean, default: true },
    enableBookmarks: { type: Boolean, default: true },
    enableFollowing: { type: Boolean, default: true },
    enableCollaboration: { type: Boolean, default: false },
    enableVersioning: { type: Boolean, default: false },
    enableAI: { type: Boolean, default: false },
    enableTranslation: { type: Boolean, default: false },
  },

  api: {
    enablePublicAPI: { type: Boolean, default: false },
    requireAPIKey: { type: Boolean, default: true },
    rateLimitPerHour: { type: Number, default: 1000 },
    enableWebhooks: { type: Boolean, default: false },
    webhookEndpoints: [{
      url: { type: String, required: true },
      events: [{ type: String, required: true }],
      secret: { type: String },
    }],
  },

  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: String, default: '1.0.0' },
}, {
  timestamps: true,
});

// Indexes
SiteSettingsSchema.index({ lastUpdated: -1 });
SiteSettingsSchema.index({ version: 1 });

// Static method to get default settings
SiteSettingsSchema.statics.getDefaults = function() {
  return {
    siteInfo: {
      siteName: 'Social Justice Platform',
      siteDescription: 'Platform for social justice advocacy and community empowerment',
      siteUrl: 'https://genderequality.az',
      contactEmail: 'contact@genderequality.az',
      supportEmail: 'support@genderequality.az',
      socialLinks: {},
    },
    contentPolicies: {
      requireApproval: true,
      autoApproveVerifiedUsers: false,
      maxArticleLength: 50000,
      maxStoryLength: 10000,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      maxFileSize: 10,
      moderationKeywords: [],
      bannedWords: [],
      enableProfanityFilter: true,
      enableSpamDetection: true,
    },
    userManagement: {
      allowRegistration: true,
      requireEmailVerification: true,
      defaultUserRole: 'user',
      maxUsersPerDay: 100,
      enableUserSuspension: true,
      suspensionReasons: ['Spam', 'Inappropriate Content', 'Harassment', 'Terms Violation'],
      enableUserDeletion: true,
      dataRetentionDays: 365,
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: false,
      emailProvider: 'smtp',
      emailConfig: {},
      defaultNotificationSettings: {
        articleApproved: true,
        articleRejected: true,
        newFollower: true,
        systemUpdates: true,
      },
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 1440,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableCaptcha: false,
      captchaProvider: 'recaptcha',
      captchaConfig: {},
      enableRateLimit: true,
      rateLimitConfig: {
        windowMs: 900000,
        maxRequests: 100,
      },
    },
    analytics: {
      enableGoogleAnalytics: false,
      enableHotjar: false,
      enableErrorTracking: true,
      errorTrackingProvider: 'sentry',
      errorTrackingConfig: {},
    },
    performance: {
      enableCaching: true,
      cacheTimeout: 3600,
      enableCompression: true,
      enableCDN: false,
      enableImageOptimization: true,
      imageQuality: 80,
    },
    maintenance: {
      enableMaintenanceMode: false,
      maintenanceMessage: 'Site is under maintenance. Please check back later.',
      enableAutomaticBackups: true,
      backupFrequency: 'daily',
      backupRetentionDays: 30,
      enableDatabaseOptimization: true,
      optimizationSchedule: '0 2 * * 0',
    },
    features: {
      enableComments: true,
      enableLikes: true,
      enableSharing: true,
      enableBookmarks: true,
      enableFollowing: true,
      enableCollaboration: false,
      enableVersioning: false,
      enableAI: false,
      enableTranslation: false,
    },
    api: {
      enablePublicAPI: false,
      requireAPIKey: true,
      rateLimitPerHour: 1000,
      enableWebhooks: false,
      webhookEndpoints: [],
    },
  };
};

// Ensure only one settings document exists
SiteSettingsSchema.pre('save', async function() {
  const count = await (this.constructor as mongoose.Model<ISiteSettings>).countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one site settings document is allowed');
  }
});

// Interface for static methods
interface ISiteSettingsModel extends mongoose.Model<ISiteSettings> {
  getDefaults(): any;
}

const SiteSettings = (mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)) as ISiteSettingsModel;

export default SiteSettings;
export type { ISiteSettings, ISiteSettingsModel };