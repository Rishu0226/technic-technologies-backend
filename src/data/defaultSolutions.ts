const process = [
  { step: '01', title: 'Understand', description: 'Learn the business goals, users, and constraints.' },
  { step: '02', title: 'Plan', description: 'Shape the solution, architecture, and delivery plan.' },
  { step: '03', title: 'Develop', description: 'Build the product with the technologies already used at TechNic.' },
  { step: '04', title: 'Deploy', description: 'Release with a clear handover and monitoring.' },
  { step: '05', title: 'Support', description: 'Stay on after launch to improve and extend the system.' },
];

const cta = {
  title: 'Have a Solution in Mind?',
  description: 'Tell us about your requirements and our team will help you find the right technology solution.',
  buttonText: 'Talk to Our Experts',
};

const stack = [
  { name: 'React', category: 'Frontend', icon: 'Layout' },
  { name: 'Next.js', category: 'Frontend', icon: 'Layers' },
  { name: 'Node.js', category: 'Backend', icon: 'Server' },
  { name: 'TypeScript', category: 'Engineering', icon: 'Code' },
  { name: 'MongoDB', category: 'Data', icon: 'Server' },
  { name: 'PostgreSQL', category: 'Data', icon: 'Server' },
  { name: 'Docker', category: 'Cloud', icon: 'Terminal' },
  { name: 'AWS', category: 'Cloud', icon: 'Cpu' },
];

function solution(input: {
  title: string;
  slug: string;
  icon: string;
  industry: string;
  shortDescription: string;
  description: string;
  order: number;
}) {
  return {
    ...input,
    heroTitle: input.title,
    heroDescription: input.shortDescription,
    overview: { title: 'What We Build', description: input.description },
    benefits: [
      { title: 'Built around the workflow', description: 'The solution follows how the team already works, then removes the slow steps.', icon: input.icon },
      { title: 'Ready to grow', description: 'The architecture can take on more users, locations, and features without a rewrite.', icon: 'Layers' },
      { title: 'Connected to current systems', description: 'New software can sit beside the tools the organization already uses.', icon: 'Server' },
      { title: 'Support after launch', description: 'The same engineering team stays available once the solution is in use.', icon: 'ShieldCheck' },
    ],
    features: [
      { title: 'Role-based workspaces', description: 'People see the tasks and information that belong to their role.', icon: 'Layout' },
      { title: 'Operational visibility', description: 'Leaders can follow progress without waiting for a separate report.', icon: 'Cpu' },
      { title: 'Secure access', description: 'Accounts, permissions, and activity stay under the organization\'s control.', icon: 'ShieldCheck' },
    ],
    useCases: [
      { title: 'Replace scattered tools', description: 'Bring the daily workflow into one system instead of spreadsheets and inboxes.' },
      { title: 'Support more than one location', description: 'Give each site the same process while keeping a shared view of the work.' },
      { title: 'Prepare for the next release', description: 'Leave room for automation and new modules after the first launch.' },
    ],
    process,
    technologies: stack,
    faqs: [
      { question: 'Can this work with software we already use?', answer: 'Yes. The solution can connect to existing systems where an integration is practical, instead of forcing a full replacement on day one.' },
      { question: 'Who owns the software after launch?', answer: 'You do. TechNic builds the solution for your organization and stays available for support and later releases.' },
      { question: 'How does a project start?', answer: 'We begin by understanding the workflow, then propose a scope, timeline, and the first release.' },
    ],
    cta,
    seo: {
      metaTitle: input.title,
      metaDescription: input.shortDescription,
      keywords: `${input.industry}, ${input.title}, TechNic Technologies`,
    },
    status: 'Published' as const,
  };
}

export const defaultSolutions = [
  solution({
    title: 'Healthcare Solutions',
    slug: 'healthcare',
    icon: 'HeartPulse',
    industry: 'Healthcare',
    order: 1,
    shortDescription: 'Digital healthcare platforms for hospitals, clinics, and care teams that need clearer patient and operational workflows.',
    description: 'We design healthcare software around appointments, records, and day-to-day coordination. The goal is a system care teams can trust, with access controls and a workflow that matches how the organization already works.',
  }),
  solution({
    title: 'Education Solutions',
    slug: 'education',
    icon: 'GraduationCap',
    industry: 'Education',
    order: 2,
    shortDescription: 'Learning platforms for schools, universities, and training teams that need a clearer path from enrollment to progress.',
    description: 'Education solutions cover courses, learners, and administration in one place. Institutions can publish content, follow progress, and give faculty and students a simple way to work together.',
  }),
  solution({
    title: 'Retail & E-Commerce',
    slug: 'retail-ecommerce',
    icon: 'ShoppingCart',
    industry: 'Retail',
    order: 3,
    shortDescription: 'Commerce platforms for catalogs, orders, and store operations that need to stay reliable as the catalog grows.',
    description: 'Retail solutions connect the storefront, catalog, and order flow. Teams can manage products and fulfillment without splitting the work across tools that do not talk to each other.',
  }),
  solution({
    title: 'Manufacturing Solutions',
    slug: 'manufacturing',
    icon: 'Factory',
    industry: 'Manufacturing',
    order: 4,
    shortDescription: 'Systems for production, inventory, and plant coordination so teams can see the work in progress.',
    description: 'Manufacturing software gives production and inventory teams one view of orders, materials, and progress. The system is shaped around the plant workflow rather than a generic dashboard.',
  }),
  solution({
    title: 'Logistics & Supply Chain',
    slug: 'logistics',
    icon: 'Truck',
    industry: 'Logistics',
    order: 5,
    shortDescription: 'Tools to coordinate shipments, warehouses, and delivery operations across more than one location.',
    description: 'Logistics solutions follow goods from the warehouse to delivery. Dispatch, inventory, and status stay in one system so teams are not reconciling updates by hand.',
  }),
  solution({
    title: 'Finance & FinTech',
    slug: 'finance-fintech',
    icon: 'Landmark',
    industry: 'Finance',
    order: 6,
    shortDescription: 'Secure platforms for payments, lending, and financial operations that need a clear record of every step.',
    description: 'Finance solutions focus on controlled workflows, reporting, and the systems around payments or lending. Access, history, and review stay visible to the people who need them.',
  }),
];
