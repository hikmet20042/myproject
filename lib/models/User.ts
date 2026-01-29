import mongoose from 'mongoose'

interface IUser extends mongoose.Document {
  name: string
  email: string
  password?: string
  image?: string
  profileImage?: {
    url: string
    publicId: string
  }
  emailVerified?: Date | null
  verificationToken?: string
  verificationEmailLastSent?: Date | null
  passwordResetToken?: string
  passwordResetExpires?: Date
  role: 'user' | 'admin'
  authProvider: 'credentials' | 'google' // Track how user registered
  savedEvents: mongoose.Types.ObjectId[]
  savedVacancies: mongoose.Types.ObjectId[]
  // Social media accounts for all users
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function(this: IUser) {
      // Password is required only if not using OAuth
      return !this.image && !this.emailVerified;
    },
  },
  image: {
    type: String,
  },
  profileImage: {
    url: {
      type: String,
    },
    publicId: {
      type: String,
    }
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  verificationToken: {
    type: String,
  },
  verificationEmailLastSent: {
    type: Date,
    default: null,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google'],
    required: true,
    default: 'credentials'
  },
  savedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  savedVacancies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vacancy'
  }],
  // Social media accounts for all users
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    website: String
  }
}, {
  timestamps: true,
})

// Check if email is admin email and set role accordingly
UserSchema.pre('save', function(this: IUser) {
  if (this.email === 'hikmat.mammadlii@gmail.com') {
    this.role = 'admin'
  }
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
