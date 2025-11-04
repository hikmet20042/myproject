import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId?: mongoose.Types.ObjectId;
  ngoId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: false },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object },
  actionUrl: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
