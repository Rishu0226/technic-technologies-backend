import { Request, Response } from 'express';
import { Career } from '../models/Career';
import { Application } from '../models/Application';
import { uploadPublicResume } from './uploadController';
import cloudinary from '../config/cloudinary';
import { sanitizeHtml } from '../utils/html';
import { toPublic } from '../utils/public';
import { cleanSlug, duplicateSlug, slugPattern, SLUG_DUPLICATE_ERROR, SLUG_FORMAT_ERROR } from '../utils/slug';

function prepareCareer(body: Record<string, unknown>, requireSlug: boolean) {
  const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
  const slug = cleanSlug(body.slug);
  if ((requireSlug || hasSlug) && !slugPattern.test(slug)) return { error: SLUG_FORMAT_ERROR };
  const data = { ...body };
  if (hasSlug) data.slug = slug;
  if (typeof data.longDescription === 'string') data.longDescription = sanitizeHtml(data.longDescription);
  return { data };
}

// Public endpoints
export const getCareers = async (_req: Request, res: Response) => {
  try {
    const careers = await Career.find({ status: 'Published' }).sort({ createdAt: -1 });
    res.json(toPublic(careers));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAdminCareers = async (_req: Request, res: Response) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCareerBySlug = async (req: Request, res: Response) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, status: 'Published' });
    if (!career) return res.status(404).json({ error: 'Job not found' });
    res.json(toPublic(career));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ error: 'Job not found' });
    res.json(career);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin endpoints
export const createCareer = async (req: Request, res: Response) => {
  try {
    const prepared = prepareCareer(req.body, true);
    if ('error' in prepared) return res.status(400).json({ error: prepared.error });
    const career = await Career.create(prepared.data);
    res.status(201).json(career);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const updateCareer = async (req: Request, res: Response) => {
  try {
    const prepared = prepareCareer(req.body, false);
    if ('error' in prepared) return res.status(400).json({ error: prepared.error });
    const career = await Career.findByIdAndUpdate(req.params.id, prepared.data, { returnDocument: "after" });
    if (!career) return res.status(404).json({ error: 'Job not found' });
    res.json(career);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const deleteCareer = async (req: Request, res: Response) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[\d\s().-]{7,20}$/;
const resumePattern = /\.(pdf|doc|docx)$/i;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function applicationFieldError(field: { name: string; label: string; type: string; required?: boolean }, value: string, options: string[]) {
  const label = field.label || field.name;
  if (field.required !== false && !value) return `${label} is required.`;
  if (!value) return '';
  if (field.type === 'email' && !emailPattern.test(value)) return `${label} must be a valid email address.`;
  if (field.type === 'tel' && !phonePattern.test(value)) return `${label} must be a valid phone number.`;
  if (field.type === 'link' && !isHttpUrl(value)) return `${label} must be a valid link starting with http:// or https://.`;
  if (field.type === 'file' && !isHttpUrl(value) && !resumePattern.test(value)) return `${label} must be a PDF or Word file.`;
  if (field.type === 'select' && field.name === 'experience' && options.length > 0 && !options.includes(value)) {
    return `${label} must be one of the listed options.`;
  }
  return '';
}

// Application endpoints
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, status: 'Published' });
    if (!career) return res.status(404).json({ error: 'Job not found' });

    const body = req.body && typeof req.body === 'object' ? { ...req.body } as Record<string, unknown> : {};
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    for (const file of uploadedFiles) {
      try {
        body[file.fieldname] = await uploadPublicResume(file);
      } catch (error) {
        const message = error instanceof Error && error.message === 'Cloudinary is not configured.'
          ? 'Cloudinary is not configured.'
          : 'Resume upload failed.';
        return res.status(500).json({ error: message });
      }
    }
    const fields: Record<string, string> = {};
    const options = Array.isArray(career.experienceOptions) ? career.experienceOptions : [];

    for (const field of career.applicationFields || []) {
      if (field.active === false || !field.name) continue;
      const raw = body[field.name];
      const value = typeof raw === 'string' ? raw.trim() : '';
      const error = applicationFieldError(field, value, options);
      if (error) return res.status(400).json({ error });
      if (value) fields[field.name] = value;
    }

    const applicantName = [fields.firstName, fields.lastName].filter(Boolean).join(' ')
      || fields.applicantName
      || fields.fullName
      || fields.name
      || 'Applicant';
    const resumeCandidate = fields.resumeUrl || fields.resume || '';

    const application = await Application.create({
      jobId: career._id,
      applicantName,
      email: fields.email || '',
      phone: fields.phone || '',
      experience: fields.experience || '',
      resumeUrl: resumeCandidate,
      fields,
    });

    res.status(201).json({ message: 'Application submitted successfully', id: application._id });
  } catch (error) {
    res.status(400).json({ error: 'Invalid application data' });
  }
};

function cloudinaryResume(url: string) {
  const match = url.match(/res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)\.([a-z0-9]+)(?:\?.*)?$/i);
  if (!match) return null;
  return { resourceType: match[1], publicId: match[2], format: match[3] };
}

function signedResumeUrl(url: string, attachment: boolean) {
  const asset = cloudinaryResume(url);
  if (!asset) return url;
  return cloudinary.utils.private_download_url(asset.publicId, asset.format, {
    resource_type: asset.resourceType,
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
    ...(attachment ? { attachment: true } : {}),
  });
}

export const getApplicationResume = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id);
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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Get applications
export const getApplications = async (req: Request, res: Response) => {
  try {
    const filter: any = req.query.jobId ? { jobId: req.query.jobId } : {};
    const applications = await Application.find(filter)
      .populate('jobId', 'title department')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Update application status
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id, 
      { status, ...(notes !== undefined && { notes }) },
      { returnDocument: "after" }
    );
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
};
