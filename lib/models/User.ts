import mongoose from 'mongoose'

interface IUser extends mongoose.Document {
  name: string
  email: string
  password?: string
  image?: string
  emailVerified?: Date | null
  verificationToken?: string
  role: 'user' | 'admin'
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
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
