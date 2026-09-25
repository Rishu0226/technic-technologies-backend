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
  const raw = process.env.GEMINI_API_KEY || process.env.DEEP_SEEK_API_KEY || '';
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
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body,
      }
    );
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
    console.error('Blog Generation Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
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
    console.error('Career Generation Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
