import { Request, Response } from 'express';
import { SiteSettings } from '../models/SiteSettings';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SiteSettings.findOne();
    if (!settings) {
      // Return default if not initialized yet
      return res.json({
        companyName: 'Technic Technologies',
        address: '100 Innovation Drive\nTech District, CA 94043',
        email: 'hello@technic.dev',
        phone: '+1 (555) 000-0000',
        whatsapp: '+1 (555) 000-0001',
        socialLinks: {},
        googleMaps: '',
        footerInformation: '© 2026 Technic Technologies. All rights reserved.'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      settings = await SiteSettings.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
};
