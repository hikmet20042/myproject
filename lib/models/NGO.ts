import mongoose from 'mongoose'

interface INGO extends mongoose.Document {
  organizationName: string
  email: string
  password: string
  profileImage?: {
    url: string
    publicId: string
  }
  description: string
  website?: string
  contactPhone?: string
  address?: string
  registrationNumber?: string
  focusAreas?: string[]
  status: 'pending' | 'approved' | 'rejected'
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  adminComment?: string
  verificationToken?: string
  emailVerified?: Date | null
  // Contact person information
  contactPerson: {
    name: string
    email: string
    phone?: string
    position?: string
  }
  // Social media accounts
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
}

const NGOSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    url: {
      type: String,
    },
    publicId: {
      type: String,
    }
  },
  verificationToken: {
    type: String
  },
  emailVerified: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminComment: {
    type: String
  },
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    position: {
      type: String
    }
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    website: String
  },


}, {
  timestamps: true
})

// Index for better performance
NGOSchema.index({ organizationName: 1 })
NGOSchema.index({ status: 1 })


export default mongoose.models.NGO || mongoose.model<INGO>('NGO', NGOSchema)
export type { INGO }