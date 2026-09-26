"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplications = exports.submitApplication = exports.deleteCareer = exports.updateCareer = exports.createCareer = exports.getCareerBySlug = exports.getCareers = void 0;
const Career_1 = require("../models/Career");
const Application_1 = require("../models/Application");
const html_1 = require("../utils/html");
const slug_1 = require("../utils/slug");
function prepareCareer(body, requireSlug) {
    const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
    const slug = (0, slug_1.cleanSlug)(body.slug);
    if ((requireSlug || hasSlug) && !slug_1.slugPattern.test(slug))
        return { error: slug_1.SLUG_FORMAT_ERROR };
    const data = { ...body };
    if (hasSlug)
        data.slug = slug;
    if (typeof data.longDescription === 'string')
        data.longDescription = (0, html_1.sanitizeHtml)(data.longDescription);
    return { data };
}
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
        const prepared = prepareCareer(req.body, true);
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const career = await Career_1.Career.create(prepared.data);
        res.status(201).json(career);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
    }
};
exports.createCareer = createCareer;
const updateCareer = async (req, res) => {
    try {
        const prepared = prepareCareer(req.body, false);
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const career = await Career_1.Career.findByIdAndUpdate(req.params.id, prepared.data, { returnDocument: "after" });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json(career);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
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
        const application = await Application_1.Application.findByIdAndUpdate(req.params.id, { status, ...(notes !== undefined && { notes }) }, { returnDocument: "after" });
        if (!application)
            return res.status(404).json({ error: 'Application not found' });
        res.json(application);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
