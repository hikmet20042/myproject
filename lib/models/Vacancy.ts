import mongoose from 'mongoose'

interface IVacancy extends mongoose.Document {
  title: string
  description: string
  type: 'job' | 'volunteer' | 'internship'
  category: string
  workType: 'remote' | 'onsite' | 'hybrid'
  location: {
    city?: string
    country?: string
    address?: string
    isRemote: boolean
  }
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'any'
  duration: {
    type: 'permanent' | 'contract' | 'temporary'
    contractLength?: {
      value: number
      unit: 'months' | 'years'
    }
  }
  compensation: {
    type: 'paid' | 'unpaid' | 'stipend'
    amount?: number
    currency?: string
    period?: 'hourly' | 'monthly' | 'yearly'
    benefits?: string[]
  }
  applicationProcess: {
    applicationLink?: string
    email?: string
    instructions: string
    requiredDocuments: string[]
  }
  applicationDeadline: Date
  startDate?: Date
  skills: string[]
  languages?: string[]
  tags: string[]
  imageUrl?: string
  createdBy: mongoose.Types.ObjectId
  status: 'pending' | 'approved' | 'rejected'
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  rejectedAt?: Date
  rejectionReason?: string
  adminComment?: string
  isPublished: boolean
  isFeatured: boolean
  isUrgent: boolean
  applicationCount: number
}

const VacancySchema = new mongoose.Schema<IVacancy>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000
  },
  type: {
    type: String,
    enum: ['job', 'volunteer', 'internship'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Program Management',
      'Project Coordination',
      'Research & Analysis',
      'Communications & Media',
      'Fundraising & Development',
      'Legal & Advocacy',
      'Finance & Administration',
      'Human Resources',
      'IT & Technology',
      'Field Operations',
      'Community Outreach',
      'Education & Training',
      'Healthcare & Medical',
      'Social Work',
      'Environmental',
      'Emergency Response',
      'Monitoring & Evaluation',
      'Grant Writing',
      'Marketing & Design',
      'Other'
    ]
  },
  workType: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true
  },
  location: {
    city: String,
    country: String,
    address: String,
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  requirements: [{
    type: String,
    trim: true,
    required: true
  }],
  responsibilities: [{
    type: String,
    trim: true,
    required: true
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'any'],
    required: true
  },
  duration: {
    type: {
      type: String,
      enum: ['permanent', 'contract', 'temporary'],
      required: true
    },
    contractLength: {
      value: {
        type: Number,
        min: 1
      },
      unit: {
        type: String,
        enum: ['months', 'years']
      }
    }
  },
  compensation: {
    type: {
      type: String,
      enum: ['paid', 'unpaid', 'stipend'],
      required: true
    },
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly']
    },
    benefits: [{
      type: String,
      trim: true
    }]
  },
  applicationProcess: {
    applicationLink: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Application link must be a valid URL'
      }
    },
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    instructions: {
      type: String,
      required: true,
      maxlength: 1000
    },
    requiredDocuments: [{
      type: String,
      enum: [
        'CV/Resume',
        'Cover Letter',
        'Portfolio',
        'References',
        'Certificates',
        'Transcripts',
        'Writing Sample',
        'Other'
      ]
    }]
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  startDate: Date,
  skills: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  adminComment: {
    type: String,
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  applicationCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
})

// Indexes for better query performance
VacancySchema.index({ type: 1 })
VacancySchema.index({ category: 1 })
VacancySchema.index({ workType: 1 })
VacancySchema.index({ experienceLevel: 1 })
VacancySchema.index({ 'location.city': 1 })
VacancySchema.index({ 'location.country': 1 })
VacancySchema.index({ applicationDeadline: 1 })
VacancySchema.index({ status: 1, isPublished: 1 })
VacancySchema.index({ createdBy: 1 })
VacancySchema.index({ 'compensation.type': 1 })
VacancySchema.index({ isUrgent: 1 })
VacancySchema.index({ isFeatured: 1 })

// Virtual for checking if application is open
VacancySchema.virtual('isApplicationOpen').get(function() {
  return this.applicationDeadline > new Date()
})

// Virtual for checking if position is starting soon
VacancySchema.virtual('isStartingSoon').get(function() {
  if (!this.startDate) return false
  const now = new Date()
  const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000))
  return this.startDate <= twoWeeksFromNow && this.startDate > now
})

const Vacancy = mongoose.models.Vacancy || mongoose.model<IVacancy>('Vacancy', VacancySchema)

export default Vacancy
export type { IVacancy }