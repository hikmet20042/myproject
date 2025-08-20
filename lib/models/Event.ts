import mongoose from 'mongoose'

interface IEvent extends mongoose.Document {
  title: string
  description: string
  category: string
  eventDate: Date
  endDate?: Date
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
  isApproved: boolean
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  rejectedAt?: Date
  rejectionReason?: string
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
      'Other'
    ]
  },
  eventDate: {
    type: Date,
    required: true
  },
  endDate: Date,
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
EventSchema.index({ eventDate: 1 })
EventSchema.index({ category: 1 })
EventSchema.index({ 'location.city': 1 })
EventSchema.index({ isApproved: 1, isPublished: 1 })
EventSchema.index({ createdBy: 1 })

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