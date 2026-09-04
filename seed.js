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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Career_1 = require("./src/models/Career");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technictechnologies';
const seedData = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding');
        // Seed Admin User
        const { User } = await Promise.resolve().then(() => __importStar(require('./src/models/User')));
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
        if (adminEmail && adminPassword) {
            const existingAdmin = await User.findOne({ email: adminEmail });
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminPassword, salt);
            if (!existingAdmin) {
                await User.create({
                    name: 'Super Admin',
                    email: adminEmail,
                    passwordHash,
                    role: 'admin',
                    status: 'active'
                });
                console.log(`Created new Super Admin: ${adminEmail}`);
            }
            else {
                await User.updateOne({ email: adminEmail }, { passwordHash });
                console.log(`Updated existing Super Admin password: ${adminEmail}`);
            }
        }
        const existingCareers = await Career_1.Career.countDocuments();
        if (existingCareers === 0) {
            const jobs = [
                {
                    title: "Senior Full-Stack Engineer",
                    slug: "senior-fullstack-engineer",
                    department: "Engineering",
                    location: "Remote (Global)",
                    employmentType: "Full-Time",
                    experience: "5+ Years",
                    experienceOptions: [
                        "3-5 Years",
                        "5-7 Years",
                        "7+ Years"
                    ],
                    description: "We are seeking a highly skilled Senior Full-Stack Engineer to lead development on our proprietary AI-enhanced platforms.",
                    responsibilities: [
                        "Architect and implement highly scalable Next.js and Express.js applications.",
                        "Design resilient database schemas and optimize MongoDB queries."
                    ],
                    requirements: [
                        "5+ years of production experience with React, Node.js, and TypeScript.",
                        "Strong understanding of microservices architecture and cloud-native patterns."
                    ],
                    skills: ["React", "Next.js", "Node.js", "TypeScript", "MongoDB", "AWS"],
                    salary: "$120,000 - $160,000 USD",
                    status: "Published",
                    applicationFields: [
                        { name: "fullName", label: "Full Name", type: "text", required: true },
                        { name: "email", label: "Email Address", type: "email", required: true },
                        { name: "phone", label: "Phone Number", type: "tel", required: true },
                        { name: "experience", label: "Years of Experience", type: "select", required: true },
                        { name: "resumeUrl", label: "Resume URL (Drive/Dropbox/etc)", type: "text", required: true },
                        { name: "linkedin", label: "LinkedIn Profile", type: "text", required: false }
                    ]
                },
                {
                    title: "Frontend Developer",
                    slug: "frontend-developer",
                    department: "Engineering",
                    location: "Noida, India",
                    employmentType: "Full-Time",
                    experience: "2+ Years",
                    experienceOptions: [
                        "0-1 Years",
                        "1-2 Years",
                        "2-4 Years",
                        "4+ Years"
                    ],
                    description: "Join our core UI team to build beautiful, responsive Next.js interfaces.",
                    responsibilities: [
                        "Build reusable React components and frontend libraries.",
                        "Translate UI/UX design wireframes to actual code."
                    ],
                    requirements: [
                        "2+ years of experience with React and modern CSS (Tailwind).",
                        "Familiarity with RESTful APIs."
                    ],
                    skills: ["React", "Next.js", "TailwindCSS", "TypeScript"],
                    status: "Published",
                    applicationFields: [
                        { name: "fullName", label: "Full Name", type: "text", required: true },
                        { name: "email", label: "Email Address", type: "email", required: true },
                        { name: "portfolio", label: "Portfolio URL", type: "text", required: true },
                        { name: "experience", label: "Experience Level", type: "select", required: true }
                    ]
                }
            ];
            await Career_1.Career.insertMany(jobs);
            console.log('Seeded career data successfully!');
        }
        // Seed Services
        const { Service } = await Promise.resolve().then(() => __importStar(require('./src/models/Service')));
        const existingServices = await Service.countDocuments();
        if (existingServices === 0) {
            const services = [
                {
                    title: "Custom Website Development",
                    slug: "custom-website-development",
                    description: "Highly customized, responsive, and performant web applications tailored to your specific business requirements and brand identity.",
                    icon: "Layout",
                    order: 1,
                    status: "Published"
                },
                {
                    title: "Mobile App Engineering",
                    slug: "mobile-app-engineering",
                    description: "Native and cross-platform mobile applications that deliver seamless user experiences across iOS and Android devices.",
                    icon: "Smartphone",
                    order: 2,
                    status: "Published"
                },
                {
                    title: "Cloud & DevOps Solutions",
                    slug: "cloud-devops-solutions",
                    description: "Automated CI/CD pipelines, containerization, and scalable cloud infrastructure to accelerate your software delivery lifecycle.",
                    icon: "Terminal",
                    order: 3,
                    status: "Published"
                },
                {
                    title: "Generative AI & ML Models",
                    slug: "generative-ai",
                    description: "Integrating intelligent algorithms and custom LLMs into your existing workflows to automate complex decision-making processes.",
                    icon: "Sparkles",
                    order: 4,
                    status: "Published"
                },
                {
                    title: "Custom Enterprise Software",
                    slug: "custom-enterprise-software",
                    description: "Scalable, high-performance backend systems and microservices architectures designed for complex organizational needs.",
                    icon: "Code",
                    order: 5,
                    status: "Published"
                },
                {
                    title: "Data & Database Engineering",
                    slug: "data-engineering",
                    description: "Robust data pipelines, database optimization, and analytics engines to turn your raw data into actionable business insights.",
                    icon: "Server",
                    order: 6,
                    status: "Published"
                }
            ];
            await Service.insertMany(services);
            console.log('Seeded services data successfully!');
        }
        // Seed Products
        const { Product } = await Promise.resolve().then(() => __importStar(require('./src/models/Product')));
        const existingProducts = await Product.countDocuments();
        if (existingProducts === 0) {
            const products = [
                {
                    name: "NicFlow AI",
                    slug: "nicflow-ai",
                    tagline: "The Autonomous Enterprise Core.",
                    description: "Our flagship ERP platform enhanced with generative AI. It predicts supply chain disruptions, automates financial reporting, and provides conversational HR interfaces.",
                    features: ["Predictive Resource Allocation", "Conversational AI Assistant", "Automated Workflows", "Quantum-Safe Encryption"],
                    icon: "Bot",
                    order: 1,
                    status: "Published"
                },
                {
                    name: "TechGuard Sentinel",
                    slug: "techguard-sentinel",
                    tagline: "Self-healing security architecture.",
                    description: "A proprietary cybersecurity product that uses deep learning to identify zero-day vulnerabilities and autonomously patches systems in real-time.",
                    features: ["Neural Network Threat Detection", "Automated Remediation", "Zero-Trust Architecture", "Compliance Autopilot"],
                    icon: "ShieldCheck",
                    order: 2,
                    status: "Published"
                },
                {
                    name: "DataStream Nexus",
                    slug: "datastream-nexus",
                    tagline: "Edge AI processing engine.",
                    description: "Designed for the IoT ecosystem, Nexus processes massive data streams at the edge, running lightweight ML models without roundtripping to the cloud.",
                    features: ["Sub-millisecond Inference", "Edge-to-Cloud Sync", "Decentralized Architecture", "Hardware Agnostic"],
                    icon: "Cpu",
                    order: 3,
                    status: "Published"
                },
                {
                    name: "NicOps Deployer",
                    slug: "nicops-deployer",
                    tagline: "Next-gen CI/CD & DevOps Automation.",
                    description: "A comprehensive DevOps toolchain product that visualizes infrastructure, automates deployments, and provides AI-driven bottleneck analysis for engineering teams.",
                    features: ["Visual Pipeline Builder", "AI Bottleneck Analysis", "One-Click Rollbacks", "Multi-Cloud Support"],
                    icon: "Rocket",
                    order: 4,
                    status: "Published"
                },
                {
                    name: "SiteCrafter Headless",
                    slug: "sitecrafter-headless",
                    tagline: "Intelligent Content Management.",
                    description: "An API-first headless CMS built for modern web teams. Features built-in SEO automation, real-time collaboration, and instant global edge caching.",
                    features: ["API-First Architecture", "Automated SEO Optimization", "Real-time Co-editing", "Global Edge CDN"],
                    icon: "Layers",
                    order: 5,
                    status: "Published"
                }
            ];
            await Product.insertMany(products);
            console.log('Seeded products data successfully!');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};
seedData();
