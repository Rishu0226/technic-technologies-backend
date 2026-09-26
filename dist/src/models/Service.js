"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const titled = {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
};
const ServiceSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    icon: { type: String, required: true },
    image: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    heroEyebrow: { type: String, default: '' },
    heroTitle: { type: String, default: '' },
    heroDescription: { type: String, default: '' },
    benefits: { type: [titled], default: undefined },
    overview: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        image: { type: String, default: '' },
    },
    features: { type: [titled], default: undefined },
    technologies: {
        type: [{
                name: { type: String, default: '' },
                category: { type: String, default: '' },
                icon: { type: String, default: '' },
            }],
        default: undefined,
    },
    process: {
        type: [{
                step: { type: String, default: '' },
                title: { type: String, default: '' },
                description: { type: String, default: '' },
            }],
        default: undefined,
    },
    deliverables: { type: [String], default: undefined },
    useCases: {
        type: [{
                title: { type: String, default: '' },
                description: { type: String, default: '' },
            }],
        default: undefined,
    },
    faqs: {
        type: [{
                question: { type: String, default: '' },
                answer: { type: String, default: '' },
            }],
        default: undefined,
    },
    cta: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        buttonText: { type: String, default: '' },
    },
    seo: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
}, { timestamps: true });
exports.Service = mongoose_1.default.model('Service', ServiceSchema);
