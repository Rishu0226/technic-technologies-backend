"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplications = exports.submitApplication = exports.deleteCareer = exports.updateCareer = exports.createCareer = exports.getCareerBySlug = exports.getCareers = void 0;
const Career_1 = require("../models/Career");
const Application_1 = require("../models/Application");
// Public endpoints
const getCareers = async (req, res) => {
    try {
        // Only return published jobs for public API
        const isPublic = !req.headers.authorization;
        const filter = isPublic ? { status: 'Published' } : {};
        const careers = await Career_1.Career.find(filter).sort({ createdAt: -1 });
        res.json(careers);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getCareers = getCareers;
const getCareerBySlug = async (req, res) => {
    try {
        const career = await Career_1.Career.findOne({ slug: req.params.slug, status: 'Published' });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json(career);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getCareerBySlug = getCareerBySlug;
// Admin endpoints
const createCareer = async (req, res) => {
    try {
        const career = await Career_1.Career.create(req.body);
        res.status(201).json(career);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.createCareer = createCareer;
const updateCareer = async (req, res) => {
    try {
        const career = await Career_1.Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json(career);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.updateCareer = updateCareer;
const deleteCareer = async (req, res) => {
    try {
        const career = await Career_1.Career.findByIdAndDelete(req.params.id);
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json({ message: 'Job deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteCareer = deleteCareer;
// Application endpoints
const submitApplication = async (req, res) => {
    try {
        const career = await Career_1.Career.findOne({ slug: req.params.slug });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        const application = await Application_1.Application.create({
            ...req.body,
            jobId: career._id
        });
        res.status(201).json({ message: 'Application submitted successfully', id: application._id });
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid application data' });
    }
};
exports.submitApplication = submitApplication;
// Admin: Get applications
const getApplications = async (req, res) => {
    try {
        const filter = req.query.jobId ? { jobId: req.query.jobId } : {};
        const applications = await Application_1.Application.find(filter)
            .populate('jobId', 'title department')
            .sort({ createdAt: -1 });
        res.json(applications);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getApplications = getApplications;
// Admin: Update application status
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const application = await Application_1.Application.findByIdAndUpdate(req.params.id, { status, ...(notes !== undefined && { notes }) }, { new: true });
        if (!application)
            return res.status(404).json({ error: 'Application not found' });
        res.json(application);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
