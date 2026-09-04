import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  gallery: string[];
  video?: string;
  author: string;
  category: string;
  tags: string[];
  seo: {
    title: string;
    description: string;
  };
  status: 'Draft' | 'Published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  featuredImage: { type: String },
  gallery: [{ type: String }],
  video: { type: String },
  author: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  seo: {
    title: { type: String },
    description: { type: String }
  },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  publishedAt: { type: Date }
}, { timestamps: true });

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
