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
  avatar?: string; // This can be either a blob URL (/api/images/id) or legacy file path
  avatarBlobId?: mongoose.Types.ObjectId; // Reference to ImageBlob
  socialLinks?: Record<string, string>;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
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
  avatar: String, // Legacy field for backward compatibility
  avatarBlobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageBlob' },
  socialLinks: { type: Object },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    website: String
  },
}, { timestamps: true });

// Virtual to get avatar URL (prioritize blob over legacy)
UserProfileSchema.virtual('avatarUrl').get(function() {
  if (this.avatarBlobId) {
    return `/api/images/${this.avatarBlobId}`;
  }
  return this.avatar || null;
});

// Ensure virtual fields are serialized
UserProfileSchema.set('toJSON', { virtuals: true });
UserProfileSchema.set('toObject', { virtuals: true });

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
