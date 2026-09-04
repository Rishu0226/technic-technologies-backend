import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  url: string;
  type: string; // e.g., 'image' or 'video'
  mimeType: string;
  size: number;
  alt: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  alt: { type: String, default: '' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Media = mongoose.model<IMedia>('Media', MediaSchema);
