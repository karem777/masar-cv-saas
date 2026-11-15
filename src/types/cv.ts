export interface SubScores {
  keywordMatch: number;
  impactAndMetrics: number;
  atsReadability: number;
  roleAlignment: number;
}

export interface CriticalFix {
  issue: string;
  fix: string;
  priority: "high" | "medium" | "low";
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  scopeStatement: string;
  bullets: string[];
  keyAchievement: string;
}

export interface ProjectItem {
  name: string;
  roleOrTech: string;
  period: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  details: string;
}

export interface RewrittenCV {
  fullName: string;
  targetTitle: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  skills: string[];
  skillCategories: SkillCategory[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  languages: string[];
}

export interface InterviewQuestion {
  question: string;
  whyAsked: string;
  sampleAnswer: string;
}

export interface AnalysisResult {
  atsScore: number;
  optimizedScore: number;
  subScores: SubScores;
  executiveFeedback: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  lockedMissingKeywordsCount: number;
  criticalFixes: CriticalFix[];
  lockedFixesCount: number;
  rewrittenCv: RewrittenCV;
  coverLetter: string;
  linkedinMessage: string;
  interviewPrep: InterviewQuestion[];
  mode: "gemini-ai" | "smart-fallback";
  isUnlocked: boolean;
  planType: "free" | "single" | "pro";
}
