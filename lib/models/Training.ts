import mongoose from 'mongoose'

interface ITraining extends mongoose.Document {
  title: string
  description: string
  category: string
  trainingType: 'online' | 'physical' | 'hybrid'
  startDate: Date
  endDate: Date
  duration: {
    value: number
    unit: 'hours' | 'days' | 'weeks' | 'months'
  }
  schedule: string // e.g., "Weekdays 9AM-5PM", "Weekends only"
  location: {
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink: string
  applicationDeadline: Date
  maxParticipants?: number
  currentParticipants: number
  prerequisites: string[]
  learningOutcomes: string[]
  certification: {
    provided: boolean
    certifyingBody?: string
    certificateName?: string
  }
  cost: {
    isFree: boolean
    amount?: number
    currency?: string
    scholarshipAvailable?: boolean
  }
  targetAudience: string[]
  tags: string[]
  imageUrl?: string
  syllabus?: string
  createdBy: mongoose.Types.ObjectId
  isApproved: boolean
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  rejectedAt?: Date
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
}

const TrainingSchema = new mongoose.Schema<ITraining>({
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
  category: {
    type: String,
    required: true,
    enum: [
      'Human Rights Training',
      'Legal Training',
      'Advocacy Skills',
      'Leadership Development',
      'Project Management',
      'Fundraising',
      'Communication Skills',
      'Digital Literacy',
      'Research Methods',
      'Community Organizing',
      'Conflict Resolution',
      'Gender Equality',
      'Child Protection',
      'Mental Health',
      'Environmental Justice',
      'Technical Skills',
      'Other'
    ]
  },
  trainingType: {
    type: String,
    enum: ['online', 'physical', 'hybrid'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      required: true
    }
  },
  schedule: {
    type: String,
    required: true,
    maxlength: 200
  },
  location: {
    address: String,
    city: String,
    country: String,
    onlineLink: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Online link must be a valid URL'
      }
    }
  },
  applicationLink: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Application link must be a valid URL'
    }
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true,
    required: true
  }],
  certification: {
    provided: {
      type: Boolean,
      default: false
    },
    certifyingBody: String,
    certificateName: String
  },
  cost: {
    isFree: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false
    }
  },
  targetAudience: [{
    type: String,
    enum: [
      'Students',
      'Professionals',
      'NGO Workers',
      'Activists',
      'Researchers',
      'Legal Professionals',
      'Community Leaders',
      'Government Officials',
      'General Public',
      'Other'
    ]
  }],
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: String,
  syllabus: {
    type: String,
    maxlength: 5000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
})

// Indexes for better query performance
TrainingSchema.index({ startDate: 1 })
TrainingSchema.index({ applicationDeadline: 1 })
TrainingSchema.index({ category: 1 })
TrainingSchema.index({ trainingType: 1 })
TrainingSchema.index({ 'location.city': 1 })
TrainingSchema.index({ isApproved: 1, isPublished: 1 })
TrainingSchema.index({ createdBy: 1 })
TrainingSchema.index({ 'cost.isFree': 1 })

// Virtual for checking if training is upcoming
TrainingSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date()
})

// Virtual for checking if application is open
TrainingSchema.virtual('isApplicationOpen').get(function() {
  return this.applicationDeadline > new Date()
})

// Virtual for checking if training is ongoing
TrainingSchema.virtual('isOngoing').get(function() {
  const now = new Date()
  return this.startDate <= now && this.endDate >= now
})

const Training = mongoose.models.Training || mongoose.model<ITraining>('Training', TrainingSchema)

export default Training
export type { ITraining }