import mongoose from 'mongoose'

interface IUser extends mongoose.Document {
  name: string
  email: string
  password?: string
  image?: string
  emailVerified?: Date | null
  verificationToken?: string
  verificationEmailLastSent?: Date | null
  passwordResetToken?: string
  passwordResetExpires?: Date
  role: 'user' | 'admin' | 'ngo'
  // Social media accounts for all users
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
  // NGO-specific fields
  ngoProfile?: {
    organizationName: string
    description: string
    website?: string
    contactPhone?: string
    address?: string
    registrationNumber?: string
    focusAreas: string[]
    isApproved: boolean
    approvedAt?: Date
    approvedBy?: mongoose.Types.ObjectId
    rejectedAt?: Date
    rejectionReason?: string
    // NGO-specific social media (in addition to general socialMedia)
    socialMedia?: {
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
      youtube?: string
      website?: string
    }
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
    enum: ['user', 'admin', 'ngo'],
    default: 'user',
  },
  // Social media accounts for all users
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    website: String
  },
  // NGO-specific profile
  ngoProfile: {
    organizationName: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'ngo';
      }
    },
    description: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'ngo';
      }
    },
    website: String,
    contactPhone: String,
    address: String,
    registrationNumber: String,
    focusAreas: [{
      type: String,
      enum: [
        'Human Rights',
        'Women Rights',
        'Children Rights',
        'Education',
        'Healthcare',
        'Environment',
        'Poverty Alleviation',
        'Legal Aid',
        'Community Development',
        'Youth Development',
        'Elderly Care',
        'Disability Rights',
        'LGBTQ+ Rights',
        'Mental Health',
        'Other'
      ]
    }],
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    // NGO-specific social media
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
      website: String
    }
  }
}, {
  timestamps: true,
})

// Check if email is admin email and set role accordingly
UserSchema.pre('save', function(this: IUser) {
  if (this.email === 'hikmat@mammadli.space') {
    this.role = 'admin'
  }
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
