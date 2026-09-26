import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  icon: string;
  image?: string;
  heroImage?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  benefits?: { title: string; description: string; icon?: string }[];
  overview?: { title?: string; description?: string; image?: string };
  features?: { title: string; description: string; icon?: string }[];
  technologies?: { name: string; category?: string; icon?: string }[];
  process?: { step?: string; title: string; description?: string }[];
  deliverables?: string[];
  useCases?: { title: string; description: string }[];
  faqs?: { question: string; answer: string }[];
  cta?: { title?: string; description?: string; buttonText?: string };
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string };
  order: number;
  status: 'Draft' | 'Published';
  createdAt: Date;
  updatedAt: Date;
}

const titled = {
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
};

const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  longDescription: { type: String, default: '' },
  icon: { type: String, required: true },
  image: { type: String, default: '' },
  heroImage: { type: String, default: '' },
  heroEyebrow: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroDescription: { type: String, default: '' },
  benefits: { type: [titled], default: undefined },
  overview: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  features: { type: [titled], default: undefined },
  technologies: {
    type: [{
      name: { type: String, default: '' },
      category: { type: String, default: '' },
      icon: { type: String, default: '' },
    }],
    default: undefined,
  },
  process: {
    type: [{
      step: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    }],
    default: undefined,
  },
  deliverables: { type: [String], default: undefined },
  useCases: {
    type: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    }],
    default: undefined,
  },
  faqs: {
    type: [{
      question: { type: String, default: '' },
      answer: { type: String, default: '' },
    }],
    default: undefined,
  },
  cta: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    buttonText: { type: String, default: '' },
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' },
  },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
}, { timestamps: true });

export const Service = mongoose.model<IService>('Service', ServiceSchema);
