"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogById = exports.getBlogBySlug = exports.getAdminBlogs = exports.getBlogs = void 0;
const Blog_1 = require("../models/Blog");
const html_1 = require("../utils/html");
const public_1 = require("../utils/public");
const slug_1 = require("../utils/slug");
function prepareBlog(body, requireSlug) {
    const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
    const slug = (0, slug_1.cleanSlug)(body.slug);
    if ((requireSlug || hasSlug) && !slug_1.slugPattern.test(slug))
        return { error: slug_1.SLUG_FORMAT_ERROR };
    const data = { ...body };
    if (hasSlug)
        data.slug = slug;
    if (typeof data.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(data.content)) {
        data.content = (0, html_1.sanitizeHtml)(data.content);
    }
    return { data };
}
const getBlogs = async (_req, res) => {
    try {
        const blogs = await Blog_1.Blog.find({ status: 'Published' }).sort({ publishedAt: -1, createdAt: -1 });
        res.json((0, public_1.toPublic)(blogs));
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getBlogs = getBlogs;
const getAdminBlogs = async (_req, res) => {
    try {
        const blogs = await Blog_1.Blog.find().sort({ publishedAt: -1, createdAt: -1 });
        res.json(blogs);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAdminBlogs = getAdminBlogs;
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.findOne({ slug: req.params.slug, status: 'Published' });
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json((0, public_1.toPublic)(blog));
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getBlogBySlug = getBlogBySlug;
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.findById(req.params.id);
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getBlogById = getBlogById;
const createBlog = async (req, res) => {
    try {
        const prepared = prepareBlog(req.body, true);
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const blog = await Blog_1.Blog.create(prepared.data);
        res.status(201).json(blog);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
    }
};
exports.createBlog = createBlog;
const updateBlog = async (req, res) => {
    try {
        const prepared = prepareBlog(req.body, false);
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const blog = await Blog_1.Blog.findByIdAndUpdate(req.params.id, prepared.data, { returnDocument: "after" });
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
    }
};
exports.updateBlog = updateBlog;
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.findByIdAndDelete(req.params.id);
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json({ message: 'Blog deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteBlog = deleteBlog;
