/**
 * PORTFOLIO CONTENT
 * -----------------------------------------------------------------------------
 * Every piece of copy, every link and every contact detail lives here.
 * Empty strings mean "not configured": the UI shows a clear placeholder and
 * disables the related action instead of inventing a value.
 */

export interface Profile {
  name: string
  displayName: string
  role: string
  tagline: string
  location: string
  currentRole: string
  company: string
}

export interface Contact {
  /** Leave empty until you want the INITIATE CONTACT button live. */
  email: string
  /** Optional alternative contact URL (e.g. a booking page). Used if no email. */
  contactUrl: string
  linkedin: string
  github: string
  githubUsername: string
}

export interface Project {
  id: string
  code: string
  title: string
  summary: string
  tech: string[]
  /** Leave empty to show a non-clickable PROJECT PREVIEW label. */
  url: string
  /** Mission classification shown on the card. */
  type: string
  /** Status chip on the mission card — any short label. Leave empty to hide the chip. */
  status: string
}

export interface ExperienceEntry {
  id: string
  company: string
  role: string
  period: string
  current: boolean
  highlights: string[]
}

export interface SkillCategory {
  id: string
  label: string
  code: string
  skills: string[]
}

export interface Certification {
  name: string
  issuer?: string
  year: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
  status: 'completed' | 'pursuing'
}

export const profile: Profile = {
  name: 'HARIHARASUDHAN N',
  displayName: 'Hariharasudhan N',
  role: 'FULL-STACK MOBILE & WEB DEVELOPER',
  tagline: 'I build digital experiences across mobile, web, and backend systems.',
  location: 'Tiruppur, Tamil Nadu, India',
  currentRole: 'Software Engineer',
  company: 'WESTLAKE Technologies',
}

export const contact: Contact = {
  email: '',
  contactUrl: '',
  linkedin: '',
  github: 'https://github.com/hariharasudhan-official',
  githubUsername: 'hariharasudhan-official',
}

export const hero = {
  hudLabel: 'SYSTEM INITIALIZING',
  title: 'EVERY DEVELOPER HAS A WORLD TO BUILD.',
}

export const projects: Project[] = [
  {
    id: 'kids-entertainment',
    code: 'M-01',
    title: 'Children’s Entertainment Platform',
    summary: 'Mobile and web experiences for children’s entertainment.',
    tech: ['React Native', 'React', 'TypeScript'],
    url: '',
    type: 'Mobile + Web',
    status: 'Active',
  },
  {
    id: 'paper-trading-app',
    code: 'M-02',
    title: 'Stock Market Paper Trading App',
    summary: 'A paper-trading experience with supporting mobile application features.',
    tech: ['React Native', 'TypeScript', 'WebSockets'],
    url: '',
    type: 'Mobile · Realtime',
    status: '',
  },
  {
    id: 'paper-trading-admin',
    code: 'M-03',
    title: 'Paper Trading Admin Portal',
    summary: 'An administrative portal built from scratch.',
    tech: ['React', 'FastAPI', 'Python'],
    url: '',
    type: 'Web · Full-stack',
    status: 'Completed',
  },
]

export const experience: ExperienceEntry[] = [
  {
    id: 'westlake',
    company: 'WESTLAKE Technologies',
    role: 'Software Engineer',
    period: 'Feb 2026 – Present',
    current: true,
    highlights: [
      'Develop and enhance a children’s entertainment mobile platform and related website.',
      'Work with Node.js, Express, TypeScript, and WebSockets.',
      'Develop React Native mobile app features.',
      'Built a paper-trading admin portal using React, FastAPI, and Python.',
      'Contribute to a React/Next.js/TypeScript marketing website.',
      'Perform testing, debugging, and Git/GitHub-based development workflows.',
    ],
  },
  {
    id: 'slp',
    company: 'SLP Plastic Company',
    role: 'Operations Analyst / Production Manager Trainee',
    period: 'Jun 2025 – Aug 2025',
    current: false,
    highlights: ['Prepared production, inventory, and delivery reports using Microsoft Excel.'],
  },
]

export const skillCategories: SkillCategory[] = [
  { id: 'programming', code: 'SK-01', label: 'Programming', skills: ['JavaScript', 'TypeScript', 'Python'] },
  {
    id: 'frontend',
    code: 'SK-02',
    label: 'Frontend & Mobile',
    skills: ['React', 'React Native', 'Expo', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap'],
  },
  {
    id: 'backend',
    code: 'SK-03',
    label: 'Backend & APIs',
    skills: ['Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'REST APIs', 'WebSockets'],
  },
  { id: 'databases', code: 'SK-04', label: 'Databases', skills: ['PostgreSQL', 'MongoDB', 'MySQL'] },
  {
    id: 'tools',
    code: 'SK-05',
    label: 'Tools & Workflow',
    skills: ['Git', 'GitHub', 'VS Code', 'Postman', 'Claude Code', 'SDLC', 'Agile', 'Manual Testing and Debugging'],
  },
]

export const certifications: Certification[] = [
  { name: 'Google AI Professional Certificate', year: '2026' },
  { name: 'Claude Code in Action', year: '2026' },
  { name: 'IBM Prompt Engineering', year: '2025' },
  { name: 'Python Full Stack Development', issuer: 'KICE', year: '2025' },
]

export const education: EducationEntry[] = [
  {
    degree: 'Master of Computer Applications',
    // Placeholder — set your institution and expected graduation year.
    institution: '',
    year: '',
    status: 'pursuing',
  },
  {
    degree: 'Bachelor of Commerce in Information Technology',
    institution: '',
    year: '2025',
    status: 'completed',
  },
]

export const finale = {
  label: 'MISSION COMPLETE',
  title: 'THE NEXT WORLD IS WAITING TO BE BUILT.',
  subtitle: 'Let’s build something meaningful.',
}

/** Resolves the primary contact action, or null when nothing is configured. */
export function getContactHref(c: Contact = contact): string | null {
  const email = c.email.trim()
  if (email) return `mailto:${email}`
  const url = c.contactUrl.trim()
  if (/^https?:\/\//i.test(url)) return url
  return null
}

/** True when a configured URL looks safe to render as a link. */
export function isValidUrl(url: string | undefined): url is string {
  return !!url && /^https?:\/\/\S+$/i.test(url.trim())
}
