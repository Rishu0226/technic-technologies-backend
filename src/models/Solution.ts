import mongoose, { Document, Schema } from 'mongoose';

export interface ISolution extends Document {
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  description: string;
  icon: string;
  industry?: string;
  cardImage?: string;
  heroImage?: string;
  heroTitle?: string;
  heroDescription?: string;
  overview?: { title?: string; description?: string };
  overviewImage?: string;
  benefits?: { title: string; description: string; icon?: string }[];
  features?: { title: string; description: string; icon?: string }[];
  useCases?: { title: string; description: string }[];
  process?: { step?: string; title: string; description?: string }[];
  technologies?: { name: string; category?: string; icon?: string }[];
  metrics?: { value: string; label: string }[];
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

const SolutionSchema = new Schema<ISolution>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  shortDescription: { type: String, default: '' },
  longDescription: { type: String, default: '' },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  industry: { type: String, default: '' },
  cardImage: { type: String, default: '' },
  heroImage: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroDescription: { type: String, default: '' },
  overview: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  overviewImage: { type: String, default: '' },
  benefits: { type: [titled], default: undefined },
  features: { type: [titled], default: undefined },
  useCases: {
    type: [{ title: { type: String, default: '' }, description: { type: String, default: '' } }],
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
  technologies: {
    type: [{
      name: { type: String, default: '' },
      category: { type: String, default: '' },
      icon: { type: String, default: '' },
    }],
    default: undefined,
  },
  metrics: {
    type: [{ value: { type: String, default: '' }, label: { type: String, default: '' } }],
    default: undefined,
  },
  faqs: {
    type: [{ question: { type: String, default: '' }, answer: { type: String, default: '' } }],
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

export const Solution = mongoose.model<ISolution>('Solution', SolutionSchema);
