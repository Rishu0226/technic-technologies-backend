"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductBySlug = exports.getProducts = void 0;
const Product_1 = require("../models/Product");
const html_1 = require("../utils/html");
const slug_1 = require("../utils/slug");
function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function normalizeLink(value) {
    if (value === undefined || value === null)
        return { ok: true, url: '' };
    if (typeof value !== 'string')
        return { ok: false };
    const raw = value.trim();
    if (!raw)
        return { ok: true, url: '' };
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
        const parsed = new URL(withProtocol);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
            return { ok: false };
        if (!parsed.hostname.includes('.'))
            return { ok: false };
        return { ok: true, url: parsed.href };
    }
    catch {
        return { ok: false };
    }
}
function namedList(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => {
        if (typeof item === 'string')
            return { title: item.trim(), description: '', icon: '' };
        return {
            title: text(item?.title),
            description: text(item?.description),
            icon: text(item?.icon),
        };
    })
        .filter((item) => item.title);
}
function stringList(value) {
    if (!Array.isArray(value))
        return [];
    return value.map((item) => text(item)).filter(Boolean);
}
function prepareProduct(body, { requireSlug }) {
    const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
    const slug = (0, slug_1.cleanSlug)(body.slug);
    if ((requireSlug || hasSlug) && !slug_1.slugPattern.test(slug)) {
        return { error: slug_1.SLUG_FORMAT_ERROR };
    }
    const rawType = body.type ?? body.productType;
    const hasType = rawType !== undefined;
    if (hasType && rawType !== 'app' && rawType !== 'website' && rawType !== 'both') {
        return { error: 'Product type must be app, website, or both.' };
    }
    const type = rawType === 'app' || rawType === 'website' || rawType === 'both' ? rawType : undefined;
    const playStore = normalizeLink(body.playStoreUrl ?? body.androidUrl);
    const appStore = normalizeLink(body.appStoreUrl ?? body.iosUrl);
    const website = normalizeLink(body.websiteUrl);
    if (!playStore.ok || !appStore.ok || !website.ok) {
        return { error: 'Product links must be valid web addresses.' };
    }
    const keepWebsite = type === 'website' || type === 'both';
    const keepApp = type === 'app' || type === 'both';
    const data = { ...body };
    delete data.productType;
    delete data.androidUrl;
    delete data.iosUrl;
    if (hasSlug)
        data.slug = slug;
    if (type) {
        data.type = type;
        data.playStoreUrl = keepApp ? playStore.url : '';
        data.appStoreUrl = keepApp ? appStore.url : '';
        data.websiteUrl = keepWebsite ? website.url : '';
    }
    if (typeof body.longDescription === 'string')
        data.longDescription = (0, html_1.sanitizeHtml)(body.longDescription);
    if (Array.isArray(body.features))
        data.features = namedList(body.features);
    if (Array.isArray(body.benefits))
        data.benefits = namedList(body.benefits);
    if (Array.isArray(body.metrics)) {
        data.metrics = body.metrics
            .map((item) => ({ value: text(item?.value), label: text(item?.label) }))
            .filter((item) => item.value || item.label);
    }
    if (Array.isArray(body.technologyStack)) {
        data.technologyStack = body.technologyStack
            .map((item) => ({ name: text(item?.name), icon: text(item?.icon) }))
            .filter((item) => item.name);
    }
    if (Array.isArray(body.mobileScreenshots)) {
        data.mobileScreenshots = body.mobileScreenshots
            .map((item) => ({
            image: text(item?.image),
            platform: item?.platform === 'ios' || item?.platform === 'android' ? item.platform : '',
        }))
            .filter((item) => item.image);
    }
    if (Array.isArray(body.gallery))
        data.gallery = stringList(body.gallery);
    if (body.seo && typeof body.seo === 'object') {
        const seo = body.seo;
        data.seo = { metaTitle: text(seo.metaTitle), metaDescription: text(seo.metaDescription) };
    }
    return { data };
}
const getProducts = async (req, res) => {
    try {
        const isPublic = !req.headers.authorization;
        const filter = isPublic ? { status: 'Published' } : {};
        const products = await Product_1.Product.find(filter).sort({ order: 1, createdAt: -1 });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getProducts = getProducts;
const getProductBySlug = async (req, res) => {
    try {
        const product = await Product_1.Product.findOne({ slug: req.params.slug, status: 'Published' });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getProductBySlug = getProductBySlug;
const createProduct = async (req, res) => {
    try {
        const prepared = prepareProduct(req.body, { requireSlug: true });
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const product = await Product_1.Product.create(prepared.data);
        res.status(201).json(product);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const prepared = prepareProduct(req.body, { requireSlug: false });
        if ('error' in prepared)
            return res.status(400).json({ error: prepared.error });
        const product = await Product_1.Product.findByIdAndUpdate(req.params.id, prepared.data, { returnDocument: 'after' });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(400).json({ error: (0, slug_1.duplicateSlug)(error) ? slug_1.SLUG_DUPLICATE_ERROR : 'Invalid data' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findByIdAndDelete(req.params.id);
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteProduct = deleteProduct;
