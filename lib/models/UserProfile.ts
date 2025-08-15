import mongoose from 'mongoose';

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  organization?: string;
  interests?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
}

const UserProfileSchema = new mongoose.Schema<IUserProfile>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: String,
  location: String,
  website: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  occupation: String,
  organization: String,
  interests: String,
  avatar: String,
  socialLinks: { type: Object },
}, { timestamps: true });

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
