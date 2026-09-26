"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplications = exports.getApplicationResume = exports.submitApplication = exports.deleteCareer = exports.updateCareer = exports.createCareer = exports.getCareerById = exports.getCareerBySlug = exports.getAdminCareers = exports.getCareers = void 0;
const Career_1 = require("../models/Career");
const Application_1 = require("../models/Application");
const uploadController_1 = require("./uploadController");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const html_1 = require("../utils/html");
const public_1 = require("../utils/public");
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
const getCareers = async (_req, res) => {
    try {
        const careers = await Career_1.Career.find({ status: 'Published' }).sort({ createdAt: -1 });
        res.json((0, public_1.toPublic)(careers));
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getCareers = getCareers;
const getAdminCareers = async (_req, res) => {
    try {
        const careers = await Career_1.Career.find().sort({ createdAt: -1 });
        res.json(careers);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAdminCareers = getAdminCareers;
const getCareerBySlug = async (req, res) => {
    try {
        const career = await Career_1.Career.findOne({ slug: req.params.slug, status: 'Published' });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json((0, public_1.toPublic)(career));
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getCareerBySlug = getCareerBySlug;
const getCareerById = async (req, res) => {
    try {
        const career = await Career_1.Career.findById(req.params.id);
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        res.json(career);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getCareerById = getCareerById;
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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[\d\s().-]{7,20}$/;
const resumePattern = /\.(pdf|doc|docx)$/i;
function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
function applicationFieldError(field, value, options) {
    const label = field.label || field.name;
    if (field.required !== false && !value)
        return `${label} is required.`;
    if (!value)
        return '';
    if (field.type === 'email' && !emailPattern.test(value))
        return `${label} must be a valid email address.`;
    if (field.type === 'tel' && !phonePattern.test(value))
        return `${label} must be a valid phone number.`;
    if (field.type === 'link' && !isHttpUrl(value))
        return `${label} must be a valid link starting with http:// or https://.`;
    if (field.type === 'file' && !isHttpUrl(value) && !resumePattern.test(value))
        return `${label} must be a PDF or Word file.`;
    if (field.type === 'select' && field.name === 'experience' && options.length > 0 && !options.includes(value)) {
        return `${label} must be one of the listed options.`;
    }
    return '';
}
// Application endpoints
const submitApplication = async (req, res) => {
    try {
        const career = await Career_1.Career.findOne({ slug: req.params.slug, status: 'Published' });
        if (!career)
            return res.status(404).json({ error: 'Job not found' });
        const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
        const uploadedFiles = Array.isArray(req.files) ? req.files : [];
        for (const file of uploadedFiles) {
            try {
                body[file.fieldname] = await (0, uploadController_1.uploadPublicResume)(file);
            }
            catch (error) {
                const message = error instanceof Error && error.message === 'Cloudinary is not configured.'
                    ? 'Cloudinary is not configured.'
                    : 'Resume upload failed.';
                return res.status(500).json({ error: message });
            }
        }
        const fields = {};
        const options = Array.isArray(career.experienceOptions) ? career.experienceOptions : [];
        for (const field of career.applicationFields || []) {
            if (field.active === false || !field.name)
                continue;
            const raw = body[field.name];
            const value = typeof raw === 'string' ? raw.trim() : '';
            const error = applicationFieldError(field, value, options);
            if (error)
                return res.status(400).json({ error });
            if (value)
                fields[field.name] = value;
        }
        const applicantName = [fields.firstName, fields.lastName].filter(Boolean).join(' ')
            || fields.applicantName
            || fields.fullName
            || fields.name
            || 'Applicant';
        const resumeCandidate = fields.resumeUrl || fields.resume || '';
        const application = await Application_1.Application.create({
            jobId: career._id,
            applicantName,
            email: fields.email || '',
            phone: fields.phone || '',
            experience: fields.experience || '',
            resumeUrl: resumeCandidate,
            fields,
        });
        res.status(201).json({ message: 'Application submitted successfully', id: application._id });
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid application data' });
    }
};
exports.submitApplication = submitApplication;
function cloudinaryResume(url) {
    const match = url.match(/res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)\.([a-z0-9]+)(?:\?.*)?$/i);
    if (!match)
        return null;
    return { resourceType: match[1], publicId: match[2], format: match[3] };
}
function signedResumeUrl(url, attachment) {
    const asset = cloudinaryResume(url);
    if (!asset)
        return url;
    return cloudinary_1.default.utils.private_download_url(asset.publicId, asset.format, {
        resource_type: asset.resourceType,
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
        ...(attachment ? { attachment: true } : {}),
    });
}
const getApplicationResume = async (req, res) => {
    try {
        const application = await Application_1.Application.findById(req.params.id);
        if (!application?.resumeUrl || !/^https?:\/\//i.test(application.resumeUrl)) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        const resumeUrl = application.resumeUrl;
        if (!resumeUrl.includes('res.cloudinary.com')) {
            return res.json({ viewUrl: resumeUrl, downloadUrl: resumeUrl });
        }
        res.json({
            viewUrl: signedResumeUrl(resumeUrl, false),
            downloadUrl: signedResumeUrl(resumeUrl, true),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getApplicationResume = getApplicationResume;
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
