"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceBySlug = exports.getServices = void 0;
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
const createService = async (req, res) => {
    try {
        const service = await Service_1.Service.create(req.body);
        res.status(201).json(service);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const service = await Service_1.Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
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
