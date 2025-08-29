import mongoose from 'mongoose'

interface IEvent extends mongoose.Document {
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
  eventDate: Date
  endDate?: Date
  // Training-specific fields
  duration?: {
    value: number
    unit: 'hours' | 'days' | 'weeks' | 'months'
  }
  schedule?: string
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: {
    provided: boolean
    certifyingBody?: string
    certificateName?: string
  }
  cost?: {
    isFree: boolean
    amount?: number
    currency?: string
    scholarshipAvailable?: boolean
  }
  targetAudience?: string[]
  syllabus?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink?: string
  applicationDeadline?: Date
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: mongoose.Types.ObjectId
  organizationName?: string
  status: 'pending' | 'approved' | 'rejected'
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  rejectedAt?: Date
  rejectionReason?: string
  adminComment?: string
  isPublished: boolean
  isFeatured: boolean
}

const EventSchema = new mongoose.Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Event categories
      'Workshop',
      'Conference',
      'Seminar',
      'Art Performance',
      'Cultural Event',
      'Fundraising',
      'Community Gathering',
      'Awareness Campaign',
      'Protest/Rally',
      'Educational Event',
      'Networking',
      'Celebration',
      // Training categories
      'Human Rights Training',
      'Legal Training',
      'Advocacy Skills',
      'Leadership Development',
      'Project Management',
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
  eventType: {
    type: String,
    enum: ['event', 'training', 'workshop', 'conference', 'seminar'],
    required: true,
    default: 'event'
  },
  eventDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  // Training-specific fields
  duration: {
    value: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months']
    }
  },
  schedule: {
    type: String
  },
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  certification: {
    provided: {
      type: Boolean,
      default: false
    },
    certifyingBody: {
      type: String
    },
    certificateName: {
      type: String
    }
  },
  cost: {
    isFree: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number
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
    type: String
  }],
  syllabus: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['online', 'physical', 'hybrid'],
      required: true
    },
    address: String,
    city: String,
    country: String,
    onlineLink: String
  },
  applicationLink: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Application link must be a valid URL'
    }
  },
  applicationDeadline: Date,
  maxParticipants: {
    type: Number,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
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
  organizationName: {
    type: String,
    trim: true
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
  }
}, {
  timestamps: true,
})

// Indexes for better query performance
EventSchema.index({ eventDate: 1 })
EventSchema.index({ category: 1 })
EventSchema.index({ eventType: 1 })
EventSchema.index({ 'location.city': 1 })
EventSchema.index({ status: 1, isPublished: 1 })
EventSchema.index({ createdBy: 1 })
EventSchema.index({ tags: 1 })
EventSchema.index({ isFeatured: 1 })
EventSchema.index({ title: 'text', description: 'text' })
EventSchema.index({ eventType: 1, category: 1 })
EventSchema.index({ eventType: 1, eventDate: 1 })

// Virtual for checking if event is upcoming
EventSchema.virtual('isUpcoming').get(function() {
  return this.eventDate > new Date()
})

// Virtual for checking if registration is open
EventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date()
  return this.applicationDeadline ? this.applicationDeadline > now : this.eventDate > now
})

const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema)

export default Event
export type { IEvent }