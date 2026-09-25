import { Request, Response } from 'express';
import { Solution } from '../models/Solution';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanSlug(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function duplicateSlug(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export const getSolutions = async (req: Request, res: Response) => {
  try {
    const isPublic = !req.headers.authorization;
    const solutions = await Solution.find(isPublic ? { status: 'Published' } : {}).sort({ order: 1, createdAt: -1 });
    res.json(solutions);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSolutionBySlug = async (req: Request, res: Response) => {
  try {
    const solution = await Solution.findOne({ slug: req.params.slug, status: 'Published' });
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json(solution);
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
    const solution = await Solution.create({ ...req.body, slug });
    res.status(201).json(solution);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? 'Slug must be unique.' : 'Invalid data' });
  }
};

export const updateSolution = async (req: Request, res: Response) => {
  try {
    const slug = cleanSlug(req.body.slug);
    if (req.body.slug !== undefined && !slugPattern.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase words separated by hyphens.' });
    }
    const solution = await Solution.findByIdAndUpdate(
      req.params.id,
      slug ? { ...req.body, slug } : req.body,
      { returnDocument: 'after' },
    );
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    res.json(solution);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? 'Slug must be unique.' : 'Invalid data' });
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

