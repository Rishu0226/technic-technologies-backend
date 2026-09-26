import mongoose, { Document, Schema } from 'mongoose';

export interface INamedItem {
  title: string;
  description: string;
  icon?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  description: string;
  longDescription: string;
  category: string;
  heroDescription: string;
  heroImage: string;
  logo: string;
  dashboardImage: string;
  websitePreviewImage: string;
  gallery: string[];
  featureSectionTitle: string;
  featureSectionDescription: string;
  showcaseTitle: string;
  showcaseDescription: string;
  features: Array<string | INamedItem>;
  metrics: { value: string; label: string }[];
  benefits: INamedItem[];
  technologyStack: { name: string; icon?: string }[];
  mobileScreenshots: { image: string; platform?: string }[];
  ctaTitle: string;
  ctaDescription: string;
  icon: string;
  image?: string;
  type?: 'app' | 'website' | 'both';
  playStoreUrl: string;
  appStoreUrl: string;
  websiteUrl: string;
  seo: { metaTitle: string; metaDescription: string };
  order: number;
  status: 'Draft' | 'Published';
  createdAt: Date;
  updatedAt: Date;
}

const named = {
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
};

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tagline: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  description: { type: String, required: true },
  longDescription: { type: String, default: '' },
  category: { type: String, default: '' },
  heroDescription: { type: String, default: '' },
  heroImage: { type: String, default: '' },
  logo: { type: String, default: '' },
  dashboardImage: { type: String, default: '' },
  websitePreviewImage: { type: String, default: '' },
  gallery: { type: [String], default: undefined },
  featureSectionTitle: { type: String, default: '' },
  featureSectionDescription: { type: String, default: '' },
  showcaseTitle: { type: String, default: '' },
  showcaseDescription: { type: String, default: '' },
  features: { type: [Schema.Types.Mixed], default: [] },
  metrics: {
    type: [{ value: { type: String, default: '' }, label: { type: String, default: '' } }],
    default: undefined,
  },
  benefits: { type: [named], default: undefined },
  technologyStack: {
    type: [{ name: { type: String, default: '' }, icon: { type: String, default: '' } }],
    default: undefined,
  },
  mobileScreenshots: {
    type: [{ image: { type: String, default: '' }, platform: { type: String, default: '' } }],
    default: undefined,
  },
  ctaTitle: { type: String, default: '' },
  ctaDescription: { type: String, default: '' },
  icon: { type: String, required: true },
  image: { type: String },
  type: { type: String, enum: ['app', 'website', 'both'] },
  playStoreUrl: { type: String, default: '' },
  appStoreUrl: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
}, { timestamps: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
