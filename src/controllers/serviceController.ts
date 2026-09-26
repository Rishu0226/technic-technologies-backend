import { Request, Response } from 'express';
import { Service } from '../models/Service';
import { sanitizeHtml } from '../utils/html';
import { toPublic } from '../utils/public';
import { SLUG_DUPLICATE_ERROR } from '../utils/slug';

export const getServices = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find({ status: 'Published' }).sort({ order: 1, createdAt: -1 });
    res.json(toPublic(services));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAdminServices = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanSlug(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export const getServiceBySlug = async (req: Request, res: Response) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, status: 'Published' });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(toPublic(service));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const slug = cleanSlug(req.body.slug);
    if (!slugPattern.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
    }
    const longDescription = typeof req.body.longDescription === 'string' ? sanitizeHtml(req.body.longDescription) : undefined;
    const service = await Service.create({ ...req.body, slug, ...(longDescription !== undefined ? { longDescription } : {}) });
    res.status(201).json(service);
  } catch (error) {
    const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
    res.status(400).json({ error: duplicate ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const slug = cleanSlug(req.body.slug);
    if (req.body.slug !== undefined && !slugPattern.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
    }
    const payload = slug ? { ...req.body, slug } : { ...req.body };
    if (typeof req.body.longDescription === 'string') payload.longDescription = sanitizeHtml(req.body.longDescription);
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: "after" },
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
    res.status(400).json({ error: duplicate ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
