import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  features: string[];
  icon: string;
  image?: string;
  order: number;
  status: 'Draft' | 'Published';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  features: [{ type: String }],
  icon: { type: String, required: true },
  image: { type: String },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' }
}, { timestamps: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
