import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantName: string;
  email: string;
  phone: string;
  experience: string;
  resumeUrl: string;
  fields: Record<string, any>;
  status: 'New' | 'Reviewing' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Hired';
  notes?: string;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
  applicantName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  experience: { type: String, required: true },
  resumeUrl: { type: String, required: true },
  fields: { type: Schema.Types.Mixed }, // For any dynamic fields
  status: { type: String, enum: ['New', 'Reviewing', 'Shortlisted', 'Interview', 'Rejected', 'Hired'], default: 'New' },
  notes: { type: String },
  appliedDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
