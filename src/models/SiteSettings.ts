import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSettings extends Document {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  googleMaps: string;
  footerInformation: string;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  companyName: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, required: true },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
    github: { type: String }
  },
  googleMaps: { type: String },
  footerInformation: { type: String }
}, { timestamps: true }); // Only really need updatedAt for settings

export const SiteSettings = mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
