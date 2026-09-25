import { Request, Response } from 'express';

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash'];

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim() : fallback;

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getApiKey = () => {
  const raw = process.env.GEMINI_API_KEY || '';
  return raw.trim();
};

const callGemini = async (systemPrompt: string, userPrompt: string) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });

  let payload: any = null;
  let response: Awaited<ReturnType<typeof fetch>> | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
          body,
          signal: AbortSignal.timeout(25000),
        }
      );
    } catch {
      const lastModel = model === GEMINI_MODELS[GEMINI_MODELS.length - 1];
      if (lastModel) throw new Error('Gemini request timed out');
      console.warn(`Gemini ${model} timed out, trying the next model`);
      continue;
    }
    payload = await response.json().catch(() => null);

    if (response.ok) break;

    const message = payload?.error?.message || `status ${response.status}`;
    const fatal = response.status === 400 || response.status === 401 || response.status === 403;
    const lastModel = model === GEMINI_MODELS[GEMINI_MODELS.length - 1];
    if (!lastModel && !fatal) {
      console.warn(`Gemini ${model} unavailable, trying the next model:`, message);
      continue;
    }
    console.error(`Gemini ${model} failed:`, message);
    throw new Error(message || 'Failed to generate content from AI');
  }

  if (!response || !response.ok) {
    throw new Error(payload?.error?.message || 'Failed to generate content from AI');
  }

  const content = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!content) {
    const blockReason = payload?.promptFeedback?.blockReason;
    throw new Error(blockReason ? `AI request was blocked: ${blockReason}` : 'AI returned an empty response');
  }

  try {
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleanContent);
  } catch {
    console.error('Failed to parse JSON from AI:', content);
    throw new Error('AI returned invalid structured data');
  }
};

const normalizeBlog = (raw: any) => {
  const title = asString(raw?.title);
  const excerpt = asString(raw?.excerpt);
  const content = asString(raw?.content);

  if (!title || !excerpt || !content) {
    throw new Error('AI did not return a complete blog');
  }

  return {
    title,
    slug: slugify(asString(raw?.slug) || title),
    excerpt,
    content,
    author: asString(raw?.author) || 'Technic Team',
    category: asString(raw?.category) || 'Technology',
    tags: asStringArray(raw?.tags),
    featuredImage: '',
    gallery: [] as string[],
    video: '',
    seo: {
      title: asString(raw?.seo?.title) || title,
      description: (asString(raw?.seo?.description) || excerpt).slice(0, 160),
    },
  };
};

const normalizeCareer = (raw: any) => {
  const title = asString(raw?.title);
  const description = asString(raw?.description);
  const responsibilities = asStringArray(raw?.responsibilities);
  const requirements = asStringArray(raw?.requirements);
  const skills = asStringArray(raw?.skills);
  const experienceOptions = asStringArray(raw?.experienceOptions);

  if (!title || !description || responsibilities.length === 0 || requirements.length === 0) {
    throw new Error('AI did not return a complete job posting');
  }

  return {
    title,
    slug: slugify(asString(raw?.slug) || title),
    department: asString(raw?.department) || 'Engineering',
    location: asString(raw?.location) || 'Remote',
    employmentType: asString(raw?.employmentType) || 'Full-time',
    experience: asString(raw?.experience) || '3-5 Years',
    experienceOptions: experienceOptions.length > 0 ? experienceOptions : ['0-2 Years', '3-5 Years', '5+ Years'],
    description,
    responsibilities,
    requirements,
    skills,
    salary: asString(raw?.salary) || 'Competitive',
  };
};

const SERVICE_ICONS = ['Layout', 'Smartphone', 'Terminal', 'Sparkles', 'Code', 'Server', 'ShieldCheck', 'Layers', 'Cpu', 'Bot', 'Rocket'];
const SOLUTION_ICONS = [...SERVICE_ICONS, 'HeartPulse', 'GraduationCap', 'ShoppingCart', 'Factory', 'Truck', 'Landmark'];

const serviceIcon = (value: unknown, fallback = 'Code') => {
  const name = asString(value);
  return SERVICE_ICONS.includes(name) ? name : fallback;
};

const solutionIcon = (value: unknown, fallback = 'Layers') => {
  const name = asString(value);
  return SOLUTION_ICONS.includes(name) ? name : fallback;
};

const asNamedItems = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => ({
          title: asString(item?.title),
          description: asString(item?.description),
          icon: serviceIcon(item?.icon, ''),
        }))
        .filter((item) => item.title && item.description)
    : [];

const normalizeService = (raw: any) => {
  const title = asString(raw?.title);
  const description = asString(raw?.description);
  const benefits = asNamedItems(raw?.benefits);
  const features = asNamedItems(raw?.features);
  const technologies = Array.isArray(raw?.technologies)
    ? raw.technologies
        .map((item: any) => ({
          name: asString(item?.name),
          category: asString(item?.category),
          icon: serviceIcon(item?.icon, ''),
        }))
        .filter((item: { name: string }) => item.name)
    : [];
  const process = Array.isArray(raw?.process)
    ? raw.process
        .map((item: any, index: number) => ({
          step: asString(item?.step) || String(index + 1).padStart(2, '0'),
          title: asString(item?.title),
          description: asString(item?.description),
        }))
        .filter((item: { title: string }) => item.title)
    : [];
  const useCases = Array.isArray(raw?.useCases)
    ? raw.useCases
        .map((item: any) => ({ title: asString(item?.title), description: asString(item?.description) }))
        .filter((item: { title: string }) => item.title)
    : [];
  const faqs = Array.isArray(raw?.faqs)
    ? raw.faqs
        .map((item: any) => ({ question: asString(item?.question), answer: asString(item?.answer) }))
        .filter((item: { question: string; answer: string }) => item.question && item.answer)
    : [];

  if (!title || !description || benefits.length === 0 || features.length === 0) {
    throw new Error('AI did not return a complete service');
  }

  return {
    title,
    slug: slugify(asString(raw?.slug) || title),
    shortDescription: asString(raw?.shortDescription) || description.slice(0, 180),
    description,
    icon: serviceIcon(raw?.icon, 'Code'),
    heroEyebrow: asString(raw?.heroEyebrow) || 'Service',
    heroTitle: asString(raw?.heroTitle) || title,
    heroDescription: asString(raw?.heroDescription) || asString(raw?.shortDescription) || description,
    benefits,
    overview: {
      title: asString(raw?.overview?.title) || 'What We Build',
      description: asString(raw?.overview?.description) || description,
    },
    features,
    technologies,
    process,
    deliverables: asStringArray(raw?.deliverables),
    useCases,
    faqs,
    cta: {
      title: asString(raw?.cta?.title) || 'Ready to Build Your Solution?',
      description: asString(raw?.cta?.description) || 'Tell us what you are building and our engineering team will help you turn it into a scalable product.',
      buttonText: asString(raw?.cta?.buttonText) || 'Get a Free Consultation',
    },
    seo: {
      metaTitle: asString(raw?.seo?.metaTitle) || title,
      metaDescription: (asString(raw?.seo?.metaDescription) || asString(raw?.shortDescription) || description).slice(0, 160),
      keywords: asString(raw?.seo?.keywords),
    },
  };
};

export const generateServiceContent = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemPrompt = `You are a senior services writer for Technic Technologies, an enterprise software, web, mobile, cloud, data, and AI company.
Write a complete service page from the user's prompt.
Respond ONLY with a JSON object. Do not add markdown fences or commentary.
Do not include image URLs, ids, order, status, or timestamps. Images are uploaded separately.

Use this exact shape and fill every field:
{
  "title": "Service name",
  "slug": "lowercase-hyphenated-slug",
  "shortDescription": "One or two sentences for the service card",
  "description": "Three or four sentences describing the service",
  "icon": "One of Layout, Smartphone, Terminal, Sparkles, Code, Server, ShieldCheck, Layers, Cpu, Bot, Rocket",
  "heroEyebrow": "Service",
  "heroTitle": "Hero headline, usually the service name",
  "heroDescription": "Two sentences for the hero",
  "benefits": [
    { "title": "Short benefit", "description": "One sentence", "icon": "Layout" }
  ],
  "overview": {
    "title": "What We Build",
    "description": "Two or three sentences about what the team delivers"
  },
  "features": [
    { "title": "Capability", "description": "One or two sentences", "icon": "Code" }
  ],
  "technologies": [
    { "name": "Next.js", "category": "Frontend", "icon": "Layers" }
  ],
  "process": [
    { "step": "01", "title": "Discover", "description": "One sentence" }
  ],
  "deliverables": ["Specific deliverable"],
  "useCases": [
    { "title": "Business use case", "description": "One or two sentences" }
  ],
  "faqs": [
    { "question": "Customer question", "answer": "Clear answer in two sentences" }
  ],
  "cta": {
    "title": "Ready to Build Your Solution?",
    "description": "One sentence inviting the reader to talk to the team",
    "buttonText": "Get a Free Consultation"
  },
  "seo": {
    "metaTitle": "SEO title, about 60 characters",
    "metaDescription": "Meta description, 140 to 160 characters",
    "keywords": "comma, separated, keywords"
  }
}

Include 4 benefits, 6 features, 6 to 8 technologies, 6 process steps, 5 to 7 deliverables, 4 use cases, and 4 FAQs.
Process steps should be Discover, Design, Develop, Test, Launch, and Scale, written specifically for this service.
Icons must be one of: Layout, Smartphone, Terminal, Sparkles, Code, Server, ShieldCheck, Layers, Cpu, Bot, Rocket.`;

    const generatedData = normalizeService(await callGemini(systemPrompt, prompt.trim()));
    res.status(200).json({ data: generatedData });
  } catch (error: any) {
    console.error('Service Generation Error:', error instanceof Error ? error.message : 'Server error');
    const message = process.env.NODE_ENV === 'production'
      ? 'AI generation failed. Try again shortly.'
      : (error?.message || 'Server error');
    res.status(500).json({ success: false, message, error: message });
  }
};

const asSolutionItems = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => ({
          title: asString(item?.title),
          description: asString(item?.description),
          icon: solutionIcon(item?.icon, ''),
        }))
        .filter((item) => item.title && item.description)
    : [];

const normalizeSolution = (raw: any) => {
  const title = asString(raw?.title);
  const description = asString(raw?.description);
  const benefits = asSolutionItems(raw?.benefits);
  const features = asSolutionItems(raw?.features);
  const technologies = Array.isArray(raw?.technologies)
    ? raw.technologies
        .map((item: any) => ({
          name: asString(item?.name),
          category: asString(item?.category),
          icon: solutionIcon(item?.icon, ''),
        }))
        .filter((item: { name: string }) => item.name)
    : [];
  const process = Array.isArray(raw?.process)
    ? raw.process
        .map((item: any, index: number) => ({
          step: asString(item?.step) || String(index + 1).padStart(2, '0'),
          title: asString(item?.title),
          description: asString(item?.description),
        }))
        .filter((item: { title: string }) => item.title)
    : [];
  const useCases = Array.isArray(raw?.useCases)
    ? raw.useCases
        .map((item: any) => ({ title: asString(item?.title), description: asString(item?.description) }))
        .filter((item: { title: string }) => item.title)
    : [];
  const faqs = Array.isArray(raw?.faqs)
    ? raw.faqs
        .map((item: any) => ({ question: asString(item?.question), answer: asString(item?.answer) }))
        .filter((item: { question: string; answer: string }) => item.question && item.answer)
    : [];

  if (!title || !description || benefits.length === 0 || features.length === 0) {
    throw new Error('AI did not return a complete solution');
  }

  return {
    title,
    slug: slugify(asString(raw?.slug) || title),
    shortDescription: asString(raw?.shortDescription) || description.slice(0, 180),
    description,
    industry: asString(raw?.industry),
    icon: solutionIcon(raw?.icon, 'Layers'),
    heroTitle: asString(raw?.heroTitle) || title,
    heroDescription: asString(raw?.heroDescription) || asString(raw?.shortDescription) || description,
    overview: {
      title: asString(raw?.overview?.title) || 'What We Build',
      description: asString(raw?.overview?.description) || description,
    },
    benefits,
    features,
    useCases,
    process,
    technologies,
    faqs,
    cta: {
      title: asString(raw?.cta?.title) || 'Have a Solution in Mind?',
      description: asString(raw?.cta?.description) || 'Tell us about your requirements and our team will help you find the right technology solution.',
      buttonText: asString(raw?.cta?.buttonText) || 'Talk to Our Experts',
    },
    seo: {
      metaTitle: asString(raw?.seo?.metaTitle) || title,
      metaDescription: (asString(raw?.seo?.metaDescription) || asString(raw?.shortDescription) || description).slice(0, 160),
      keywords: asString(raw?.seo?.keywords),
    },
  };
};

export const generateSolutionContent = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemPrompt = `You are a senior solutions writer for Technic Technologies, an enterprise software, web, mobile, cloud, data, and AI company.
Write a complete industry solution page from the user's prompt.
Respond ONLY with a JSON object. Do not add markdown fences or commentary.
Do not include image URLs, ids, order, status, metrics, or timestamps. Images are uploaded separately.
Do not invent statistics, percentages, client counts, or compliance claims.

Use this exact shape and fill every field:
{
  "title": "Industry Solutions",
  "slug": "lowercase-hyphenated-slug",
  "shortDescription": "One or two sentences for the industry card",
  "description": "Three or four sentences describing the solution",
  "industry": "Industry name",
  "icon": "One allowed icon name",
  "heroTitle": "Hero headline, usually the solution name",
  "heroDescription": "Two sentences for the hero",
  "overview": {
    "title": "What We Build",
    "description": "Two or three sentences about what the team delivers"
  },
  "benefits": [
    { "title": "Short benefit", "description": "One sentence", "icon": "Layers" }
  ],
  "features": [
    { "title": "Capability", "description": "One or two sentences", "icon": "Code" }
  ],
  "useCases": [
    { "title": "Business use case", "description": "One or two sentences" }
  ],
  "process": [
    { "step": "01", "title": "Understand", "description": "One sentence" }
  ],
  "technologies": [
    { "name": "Next.js", "category": "Frontend", "icon": "Layers" }
  ],
  "faqs": [
    { "question": "Customer question", "answer": "Clear answer in two sentences" }
  ],
  "cta": {
    "title": "Have a Solution in Mind?",
    "description": "One sentence inviting the reader to talk to the team",
    "buttonText": "Talk to Our Experts"
  },
  "seo": {
    "metaTitle": "SEO title, about 60 characters",
    "metaDescription": "Meta description, 140 to 160 characters",
    "keywords": "comma, separated, keywords"
  }
}

Include 4 benefits, 4 features, 3 use cases, 5 process steps, 6 to 8 technologies, and 4 FAQs.
Process steps must be Understand, Plan, Develop, Deploy, and Support, written specifically for this industry.
Icons must be one of: Layout, Smartphone, Terminal, Sparkles, Code, Server, ShieldCheck, Layers, Cpu, Bot, Rocket, HeartPulse, GraduationCap, ShoppingCart, Factory, Truck, Landmark.`;

    const generatedData = normalizeSolution(await callGemini(systemPrompt, prompt.trim()));
    res.status(200).json({ data: generatedData });
  } catch (error: any) {
    console.error('Solution Generation Error:', error instanceof Error ? error.message : 'Server error');
    const message = process.env.NODE_ENV === 'production'
      ? 'AI generation failed. Try again shortly.'
      : (error?.message || 'Server error');
    res.status(500).json({ success: false, message, error: message });
  }
};

export const generateBlogContent = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemPrompt = `You are an expert blog writer for Technic Technologies, an enterprise software and AI company.
Write a complete, publish-ready article from the user's prompt.
Respond ONLY with a JSON object. Do not add markdown fences or commentary.

Use this exact shape and fill every field:
{
  "title": "Compelling SEO title",
  "slug": "lowercase-hyphenated-slug",
  "excerpt": "One or two sentences that summarize the article",
  "content": "Full article in Markdown. Include an introduction, at least three ## sections, short paragraphs, and a bullet list where it helps. Do not wrap the article in a code fence.",
  "author": "Technic Team",
  "category": "One category such as Technology, AI, Engineering, or Product",
  "tags": ["4 to 6 short tags"],
  "seo": {
    "title": "SEO title, about 60 characters",
    "description": "Meta description, 140 to 160 characters"
  }
}

Do not include image URLs, ids, status, or timestamps.`;

    const generatedData = normalizeBlog(await callGemini(systemPrompt, prompt.trim()));
    res.status(200).json({ data: generatedData });
  } catch (error: any) {
    console.error('Blog Generation Error:', error instanceof Error ? error.message : 'Server error');
    const message = process.env.NODE_ENV === 'production'
      ? 'AI generation failed. Try again shortly.'
      : (error?.message || 'Server error');
    res.status(500).json({ success: false, message, error: message });
  }
};

export const generateCareerContent = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemPrompt = `You are an expert recruiter writing job posts for Technic Technologies, an enterprise software and AI company.
Write a complete job posting from the user's prompt.
Respond ONLY with a JSON object. Do not add markdown fences or commentary.

Use this exact shape and fill every field:
{
  "title": "Job title",
  "slug": "lowercase-hyphenated-slug",
  "department": "Department name",
  "location": "City or Remote. Use the location from the prompt when one is given.",
  "employmentType": "Full-time, Part-time, Contract, or Internship",
  "experience": "Short display string such as 3-5 Years",
  "experienceOptions": ["0-2 Years", "3-5 Years", "5+ Years"],
  "description": "Three or four sentences about the role and why it matters at Technic Technologies.",
  "responsibilities": ["5 to 8 specific responsibilities"],
  "requirements": ["5 to 8 specific requirements"],
  "skills": ["6 to 10 skills"],
  "salary": "A realistic range or Competitive"
}

experienceOptions are the dropdown choices an applicant can pick. Include the role's level and nearby levels.
Do not include ids, application form fields, email addresses, status, or timestamps.`;

    const generatedData = normalizeCareer(await callGemini(systemPrompt, prompt.trim()));
    res.status(200).json({ data: generatedData });
  } catch (error: any) {
    console.error('Career Generation Error:', error instanceof Error ? error.message : 'Server error');
    const message = process.env.NODE_ENV === 'production'
      ? 'AI generation failed. Try again shortly.'
      : (error?.message || 'Server error');
    res.status(500).json({ success: false, message, error: message });
  }
};
