"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const SiteSettings_1 = require("../models/SiteSettings");
const getSettings = async (req, res) => {
    try {
        const settings = await SiteSettings_1.SiteSettings.findOne();
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
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        let settings = await SiteSettings_1.SiteSettings.findOne();
        if (!settings) {
            settings = await SiteSettings_1.SiteSettings.create(req.body);
        }
        else {
            settings = await SiteSettings_1.SiteSettings.findByIdAndUpdate(settings._id, req.body, { new: true });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.updateSettings = updateSettings;
