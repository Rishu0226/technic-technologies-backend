import mongoose, { Document, Schema } from 'mongoose';

export interface IApplicationField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'file' | 'textarea';
  required: boolean;
}

export interface ICareer extends Document {
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  experienceOptions: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  salary?: string;
  applicationFields: IApplicationField[];
  applicationEmail?: string;
  status: 'Draft' | 'Published' | 'Closed';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationFieldSchema = new Schema<IApplicationField>({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'email', 'tel', 'select', 'file', 'textarea'], required: true },
  required: { type: Boolean, default: true }
}, { _id: false });

const CareerSchema = new Schema<ICareer>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  employmentType: { type: String, required: true },
  experience: { type: String, required: true },
  experienceOptions: [{ type: String }],
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  skills: [{ type: String }],
  salary: { type: String },
  applicationFields: [ApplicationFieldSchema],
  applicationEmail: { type: String },
  status: { type: String, enum: ['Draft', 'Published', 'Closed'], default: 'Draft' },
  publishedAt: { type: Date }
}, { timestamps: true });

export const Career = mongoose.model<ICareer>('Career', CareerSchema);
