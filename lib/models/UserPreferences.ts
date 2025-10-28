import mongoose from 'mongoose';

interface IUserPreferences extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  privacy: {
    publicProfile: boolean;
    showEmail: boolean;
    showStats: boolean;
    allowDirectMessages: boolean;
    showOnlineStatus: boolean;
  };
  notifications: {
    email: {
      enabled: boolean;
      articleApproved: boolean;
      articleRejected: boolean;
      newFollower: boolean;
      articleLiked: boolean;
      articleCommented: boolean;
      weeklyDigest: boolean;
      systemUpdates: boolean;
    };
    push: {
      enabled: boolean;
      articleApproved: boolean;
      articleRejected: boolean;
      newFollower: boolean;
      articleLiked: boolean;
      articleCommented: boolean;
      systemAlerts: boolean;
    };
    inApp: {
      enabled: boolean;
      showFloatingPanel: boolean;
      autoMarkAsRead: boolean;
      soundEnabled: boolean;
    };
  };
  writing: {
    autoSave: boolean;
    autoSaveInterval: number;
    defaultPrivacy: 'public' | 'private' | 'anonymous';
    defaultCategory: string;
    defaultTags: string[];
    enableCollaboration: boolean;
    defaultFolder: string;
    enableReminders: boolean;
    wordCountGoal: number;
  };
  interface: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    editorMode: 'simple' | 'advanced';
    showLineNumbers: boolean;
    enableSpellCheck: boolean;
    enableGrammarCheck: boolean;
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;
  };
  dashboard: {
    defaultTab: string;
    showQuickStats: boolean;
    itemsPerPage: number;
    defaultView: 'grid' | 'list';
    enableAnalytics: boolean;
    showAchievements: boolean;
  };
  content: {
    enableTemplates: boolean;
    enableBulkOperations: boolean;
    defaultSortBy: string;
    defaultFilterBy: string;
    showCompletionPercentage: boolean;
    enablePrioritySystem: boolean;
    enableFolderSystem: boolean;
  };
  advanced: {
    enableBetaFeatures: boolean;
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
    dataRetentionDays: number;
    exportFormat: 'json' | 'csv' | 'pdf';
  };
  lastUpdated: Date;
  updatedBy: 'user' | 'system' | 'admin';
  mergeWithDefaults(): this;
}

interface IUserPreferencesModel extends mongoose.Model<IUserPreferences> {
  getDefaults(): any;
}



const UserPreferencesSchema = new mongoose.Schema<IUserPreferences>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  privacy: {
    publicProfile: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showStats: { type: Boolean, default: true },
    allowDirectMessages: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
  },
  
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      articleApproved: { type: Boolean, default: true },
      articleRejected: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      articleLiked: { type: Boolean, default: false },
      articleCommented: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
    },
    push: {
      enabled: { type: Boolean, default: true },
      articleApproved: { type: Boolean, default: true },
      articleRejected: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: false },
      articleLiked: { type: Boolean, default: false },
      articleCommented: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      showFloatingPanel: { type: Boolean, default: true },
      autoMarkAsRead: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true },
    },
  },
  
  writing: {
    autoSave: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 60 }, // 1 minute
    defaultPrivacy: { type: String, enum: ['public', 'private', 'anonymous'], default: 'public' },
    defaultCategory: { type: String, default: 'general' },
    defaultTags: [{ type: String }],

    enableCollaboration: { type: Boolean, default: false },
    defaultFolder: { type: String, default: 'General' },
    enableReminders: { type: Boolean, default: true },
    wordCountGoal: { type: Number, default: 500 },
  },
  
  interface: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    editorMode: { type: String, enum: ['simple', 'advanced'], default: 'simple' },
    showLineNumbers: { type: Boolean, default: false },
    enableSpellCheck: { type: Boolean, default: true },
    enableGrammarCheck: { type: Boolean, default: true },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    fontFamily: { type: String, default: 'Inter' },
  },
  
  dashboard: {
    defaultTab: { type: String, default: 'profile' },
    showQuickStats: { type: Boolean, default: true },
    itemsPerPage: { type: Number, default: 10, min: 5, max: 100 },
    defaultView: { type: String, enum: ['grid', 'list'], default: 'grid' },
    enableAnalytics: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
  },
  
  content: {
    enableTemplates: { type: Boolean, default: true },
    enableBulkOperations: { type: Boolean, default: true },
    defaultSortBy: { type: String, default: 'updatedAt' },
    defaultFilterBy: { type: String, default: 'all' },
    showCompletionPercentage: { type: Boolean, default: true },
    enablePrioritySystem: { type: Boolean, default: true },
    enableFolderSystem: { type: Boolean, default: true },
  },
  
  advanced: {
    enableBetaFeatures: { type: Boolean, default: false },
    enableAnalytics: { type: Boolean, default: true },
    enableErrorReporting: { type: Boolean, default: true },
    enablePerformanceMonitoring: { type: Boolean, default: false },
    dataRetentionDays: { type: Number, default: 365 },
    exportFormat: { type: String, enum: ['json', 'csv', 'pdf'], default: 'json' },
  },
  
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, enum: ['user', 'system', 'admin'], default: 'user' },
}, {
  timestamps: true,
});

// Indexes
// Note: userId index is automatically created by unique: true constraint
UserPreferencesSchema.index({ lastUpdated: -1 });

// Static method to get default preferences
UserPreferencesSchema.statics.getDefaults = function() {
  return {
    privacy: {
      publicProfile: true,
      showEmail: false,
      showStats: true,
      allowDirectMessages: true,
      showOnlineStatus: true,
    },
    notifications: {
      email: {
        enabled: true,
        articleApproved: true,
        articleRejected: true,
        newFollower: true,
        articleLiked: false,
        articleCommented: true,
        weeklyDigest: true,
        systemUpdates: true,
      },
      push: {
        enabled: true,
        articleApproved: true,
        articleRejected: true,
        newFollower: false,
        articleLiked: false,
        articleCommented: true,
        systemAlerts: true,
      },
      inApp: {
        enabled: true,
        showFloatingPanel: true,
        autoMarkAsRead: false,
        soundEnabled: true,
      },
    },
    writing: {
      autoSave: true,
      autoSaveInterval: 60,
      defaultPrivacy: 'public',
      defaultCategory: 'general',
      defaultTags: [],
      enableCollaboration: false,
      defaultFolder: 'General',
      enableReminders: true,
      wordCountGoal: 500,
    },
    interface: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      editorMode: 'simple',
      showLineNumbers: false,
      enableSpellCheck: true,
      enableGrammarCheck: true,
      fontSize: 'medium',
      fontFamily: 'Inter',
    },
    dashboard: {
      defaultTab: 'profile',
      showQuickStats: true,
      itemsPerPage: 10,
      defaultView: 'grid',
      enableAnalytics: true,
      showAchievements: true,
    },
    content: {
      enableTemplates: true,
      enableBulkOperations: true,
      defaultSortBy: 'updatedAt',
      defaultFilterBy: 'all',
      showCompletionPercentage: true,
      enablePrioritySystem: true,
      enableFolderSystem: true,
    },
    advanced: {
      enableBetaFeatures: false,
      enableAnalytics: true,
      enableErrorReporting: true,
      enablePerformanceMonitoring: false,
      dataRetentionDays: 365,
      exportFormat: 'json',
    },
  };
};

// Method to merge with defaults
UserPreferencesSchema.methods.mergeWithDefaults = function() {
  const defaults = (this.constructor as any).getDefaults();
  
  // Deep merge with defaults
  const merge = (target: any, source: any) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        merge(target[key], source[key]);
      } else if (target[key] === undefined) {
        target[key] = source[key];
      }
    }
  };
  
  merge(this, defaults);
  return this;
};

const UserPreferences = mongoose.models.UserPreferences as IUserPreferencesModel || mongoose.model<IUserPreferences, IUserPreferencesModel>('UserPreferences', UserPreferencesSchema);

export default UserPreferences;
