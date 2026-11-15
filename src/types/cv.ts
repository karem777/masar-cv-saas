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

export const DEFAULT_VODAFONE_CASH_NUMBER = "01011892362";

export interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  heroTitleAr: string;
  heroHighlightAr: string;
  heroSubtitleAr: string;
  announcementAr: string;
  vodafoneCashNumber: string;
  singlePlanNameAr: string;
  singlePlanPriceEgp: number;
  singlePlanDescAr: string;
  proPlanNameAr: string;
  proPlanPriceEgp: number;
  proPlanDescAr: string;
  freeVisibleMissingKeywords: number;
  freeAllUsersPromo: boolean;
  maintenanceMode: boolean;
  geminiApiKey: string;
  whatsappSupportNumber: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteNameAr: "مسارك",
  siteNameEn: "Masarak",
  heroTitleAr: "اكشف سبب رفض الـ CV بتاعك",
  heroHighlightAr: "واحصل على سيرة ذاتية تنفيذية مقبولة 96% فوراً",
  heroSubtitleAr:
    "افحص درجة الـ CV الحالي مجاناً، وشاهد كيف نعيد صياغته وفق معايير جامعة هارفارد وأنظمة الـ ATS العالمية في صفحة A4 احترافية متكاملة.",
  announcementAr:
    "75% من السير الذاتية يتم رفضها آلياً بواسطة برامج الـ ATS قبل أن يراها الـ HR",
  vodafoneCashNumber: DEFAULT_VODAFONE_CASH_NUMBER,
  singlePlanNameAr: "باقة الـ CV الواحد الاحترافية",
  singlePlanPriceEgp: 49,
  singlePlanDescAr:
    "تحميل الـ CV التنفيذي الكامل PDF + كشف جميع الكلمات المفتاحية + خطاب التقديم",
  proPlanNameAr: "باقة الشهر الكامل غير المحدودة (Pro)",
  proPlanPriceEgp: 149,
  proPlanDescAr:
    "تعديلات وتحميل بلا حدود لكل الوظائف + قوالب هارفارد والشركات العالمية + أسئلة الإنترفيو لمدة 30 يوم",
  freeVisibleMissingKeywords: 2,
  freeAllUsersPromo: false,
  maintenanceMode: false,
  geminiApiKey: "",
  whatsappSupportNumber: "01011892362"
};
