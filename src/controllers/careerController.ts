import { Request, Response } from 'express';
import { Career } from '../models/Career';
import { Application } from '../models/Application';
import { sanitizeHtml } from '../utils/html';
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
export const getCareers = async (req: Request, res: Response) => {
  try {
    // Only return published jobs for public API
    const isPublic = !req.headers.authorization;
    const filter: any = isPublic ? { status: 'Published' } : {};
    
    const careers = await Career.find(filter).sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCareerBySlug = async (req: Request, res: Response) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, status: 'Published' });
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

// Application endpoints
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug });
    if (!career) return res.status(404).json({ error: 'Job not found' });

    const application = await Application.create({
      ...req.body,
      jobId: career._id
    });

    res.status(201).json({ message: 'Application submitted successfully', id: application._id });
  } catch (error) {
    res.status(400).json({ error: 'Invalid application data' });
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
