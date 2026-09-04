"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogBySlug = exports.getBlogs = void 0;
const Blog_1 = require("../models/Blog");
const getBlogs = async (req, res) => {
    try {
        const isPublic = !req.headers.authorization;
        const filter = isPublic ? { status: 'Published' } : {};
        const blogs = await Blog_1.Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 });
        res.json(blogs);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getBlogs = getBlogs;
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.findOne({ slug: req.params.slug, status: 'Published' });
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getBlogBySlug = getBlogBySlug;
const createBlog = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.create(req.body);
        res.status(201).json(blog);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.createBlog = createBlog;
const updateBlog = async (req, res) => {
    try {
        const blog = await Blog_1.Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!blog)
            return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
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
