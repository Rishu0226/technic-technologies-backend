import { Request, Response } from 'express';
import { Blog } from '../models/Blog';
import { sanitizeHtml } from '../utils/html';
import { toPublic } from '../utils/public';
import { cleanSlug, duplicateSlug, slugPattern, SLUG_DUPLICATE_ERROR, SLUG_FORMAT_ERROR } from '../utils/slug';

function prepareBlog(body: Record<string, unknown>, requireSlug: boolean) {
  const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
  const slug = cleanSlug(body.slug);
  if ((requireSlug || hasSlug) && !slugPattern.test(slug)) return { error: SLUG_FORMAT_ERROR };
  const data = { ...body };
  if (hasSlug) data.slug = slug;
  if (typeof data.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(data.content)) {
    data.content = sanitizeHtml(data.content);
  }
  return { data };
}

export const getBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await Blog.find({ status: 'Published' }).sort({ publishedAt: -1, createdAt: -1 });
    res.json(toPublic(blogs));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAdminBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await Blog.find().sort({ publishedAt: -1, createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'Published' });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(toPublic(blog));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const prepared = prepareBlog(req.body, true);
    if ('error' in prepared) return res.status(400).json({ error: prepared.error });
    const blog = await Blog.create(prepared.data);
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const prepared = prepareBlog(req.body, false);
    if ('error' in prepared) return res.status(400).json({ error: prepared.error });
    const blog = await Blog.findByIdAndUpdate(req.params.id, prepared.data, { returnDocument: "after" });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(400).json({ error: duplicateSlug(error) ? SLUG_DUPLICATE_ERROR : 'Invalid data' });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
