"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getServiceBySlug = exports.getServices = void 0;
const Service_1 = require("../models/Service");
const getServices = async (req, res) => {
    try {
        const isPublic = !req.headers.authorization;
        const filter = isPublic ? { status: 'Published' } : {};
        const services = await Service_1.Service.find(filter).sort({ order: 1, createdAt: -1 });
        res.json(services);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getServices = getServices;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function cleanSlug(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
const getServiceBySlug = async (req, res) => {
    try {
        const service = await Service_1.Service.findOne({ slug: req.params.slug, status: 'Published' });
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getServiceBySlug = getServiceBySlug;
const getServiceById = async (req, res) => {
    try {
        const service = await Service_1.Service.findById(req.params.id);
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getServiceById = getServiceById;
const createService = async (req, res) => {
    try {
        const slug = cleanSlug(req.body.slug);
        if (!slugPattern.test(slug)) {
            return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
        }
        const service = await Service_1.Service.create({ ...req.body, slug });
        res.status(201).json(service);
    }
    catch (error) {
        const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
        res.status(400).json({ error: duplicate ? 'Slug must be unique.' : 'Invalid data' });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const slug = cleanSlug(req.body.slug);
        if (req.body.slug !== undefined && !slugPattern.test(slug)) {
            return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
        }
        const service = await Service_1.Service.findByIdAndUpdate(req.params.id, slug ? { ...req.body, slug } : req.body, { returnDocument: "after" });
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    }
    catch (error) {
        const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
        res.status(400).json({ error: duplicate ? 'Slug must be unique.' : 'Invalid data' });
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    try {
        const service = await Service_1.Service.findByIdAndDelete(req.params.id);
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json({ message: 'Service deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteService = deleteService;
