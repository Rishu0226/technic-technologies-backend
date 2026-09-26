import { Request, Response } from 'express';
import { Solution } from '../models/Solution';
import { sanitizeHtml } from '../utils/html';
import { toPublic } from '../utils/public';
import { SLUG_DUPLICATE_ERROR } from '../utils/slug';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanSlug(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function duplicateSlug(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export const getSolutions = async (_req: Request, res: Response) => {
  try {
    const solutions = await Solution.find({ status: 'Published' }).sort({ order: 1, createdAt: -1 });
    res.json(toPublic(solutions));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAdminSolutions = async (_req: Request, res: Response) => {
  try {
    const solutions = await Solution.find().sort({ order: 1, createdAt: -1 });
    res.json(solutions);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSolutionBySlug = async (req: Request, res: Response) => {
  try {
    const solution = await Solution.findOne({ slug: req.params.slug, status: 'Published' });
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json(toPublic(solution));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSolutionById = async (req: Request, res: Response) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json(solution);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSolution = async (req: Request, res: Response) => {
  try {
    const slug = cleanSlug(req.body.slug);
    if (!slugPattern.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
    }
    const longDescription = typeof req.body.longDescription === 'string' ? sanitizeHtml(req.body.longDescription) : undefined;
    const solution = await Solution.create({ ...req.body, slug, ...(longDescription !== undefined ? { longDescription } : {}) });
    res.status(201).json(solution);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const updateSolution = async (req: Request, res: Response) => {
  try {
    const slug = cleanSlug(req.body.slug);
    if (req.body.slug !== undefined && !slugPattern.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
    }
    const payload = slug ? { ...req.body, slug } : { ...req.body };
    if (typeof req.body.longDescription === 'string') payload.longDescription = sanitizeHtml(req.body.longDescription);
    const solution = await Solution.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: 'after' },
    );
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json(solution);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const deleteSolution = async (req: Request, res: Response) => {
  try {
    const solution = await Solution.findByIdAndDelete(req.params.id);
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json({ message: 'Solution deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

