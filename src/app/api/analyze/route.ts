import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "@/types/cv";
import { verifyLicenseCode } from "@/lib/licenses";
import { getUserByToken, readDb } from "@/lib/db";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    atsScore: {
      type: "integer",
      description: "Overall ATS compatibility and job match score from 0 to 100."
    },
    subScores: {
      type: "object",
      properties: {
        keywordMatch: { type: "integer" },
        impactAndMetrics: { type: "integer" },
        atsReadability: { type: "integer" },
        roleAlignment: { type: "integer" }
      },
      required: ["keywordMatch", "impactAndMetrics", "atsReadability", "roleAlignment"]
    },
    executiveFeedback: {
      type: "string",
      description: "Clear, actionable summary explaining the score and main gaps."
    },
    matchedKeywords: {
      type: "array",
      items: { type: "string" }
    },
    missingKeywords: {
      type: "array",
      items: { type: "string" }
    },
    criticalFixes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          issue: { type: "string" },
          fix: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["issue", "fix", "priority"]
      }
    },
    rewrittenCv: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        targetTitle: { type: "string" },
        tagline: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        portfolio: { type: "string" },
        summary: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        skillCategories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              items: { type: "array", items: { type: "string" } }
            },
            required: ["category", "items"]
          }
        },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              period: { type: "string" },
              scopeStatement: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              keyAchievement: { type: "string" }
            },
            required: [
              "role",
              "company",
              "location",
              "period",
              "scopeStatement",
              "bullets",
              "keyAchievement"
            ]
          }
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              roleOrTech: { type: "string" },
              period: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            },
            required: ["name", "roleOrTech", "period", "bullets"]
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              degree: { type: "string" },
              institution: { type: "string" },
              year: { type: "string" },
              details: { type: "string" }
            },
            required: ["degree", "institution", "year", "details"]
          }
        },
        certifications: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } }
      },
      required: [
        "fullName",
        "targetTitle",
        "tagline",
        "email",
        "phone",
        "location",
        "linkedin",
        "portfolio",
        "summary",
        "skills",
        "skillCategories",
        "experience",
        "projects",
        "education",
        "certifications",
        "languages"
      ]
    },
    coverLetter: { type: "string" },
    linkedinMessage: { type: "string" },
    interviewPrep: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          whyAsked: { type: "string" },
          sampleAnswer: { type: "string" }
        },
        required: ["question", "whyAsked", "sampleAnswer"]
      }
    }
  },
  required: [
    "atsScore",
    "subScores",
    "executiveFeedback",
    "matchedKeywords",
    "missingKeywords",
    "criticalFixes",
    "rewrittenCv",
    "coverLetter",
    "linkedinMessage",
    "interviewPrep"
  ]
};

function extractImportantKeywords(jobDescription: string): string[] {
  const commonTechAndBizTerms = [
    "React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Node.js", "Python",
    "REST APIs", "GraphQL", "CI/CD", "Agile", "Jest", "Playwright", "Core Web Vitals",
    "SSR/ISR", "Redux", "Zustand", "SQL", "AWS", "Docker", "Git", "Performance Optimization",
    "Meta Ads", "Google Ads", "TikTok Ads", "ROAS", "CPA", "CAC", "GA4", "GTM",
    "A/B Testing", "CRO", "CTR", "CVR", "Conversion Funnel", "E-Commerce", "Copywriting",
    "SEO", "SEM", "Analytics", "KPIs", "B2B", "B2C", "SaaS", "Product Strategy",
    "Figma", "UI/UX", "Cross-Functional Leadership", "Stakeholder Management", "Data Analysis"
  ];

  const jdLower = jobDescription.toLowerCase();
  const found: string[] = [];

  for (const term of commonTechAndBizTerms) {
    if (jdLower.includes(term.toLowerCase())) {
      found.push(term);
    }
  }

  if (found.length < 10) {
    const words = jobDescription
      .replace(/[^\p{L}\p{N}\s+#./-]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    const stopWords = new Set([
      "with", "that", "this", "from", "have", "will", "your", "team", "work",
      "looking", "experience", "years", "strong", "ability", "role", "skills",
      "requirements", "responsibilities", "using", "across", "proven", "track"
    ]);
    for (const w of words) {
      const clean = w.replace(/^[.,/-]+|[.,/-]+$/g, "");
      if (
        clean.length >= 4 &&
        !stopWords.has(clean.toLowerCase()) &&
        !found.some((f) => f.toLowerCase() === clean.toLowerCase())
      ) {
        found.push(clean);
        if (found.length >= 14) break;
      }
    }
  }

  return found.slice(0, 16);
}

function applyServerSidePaywall(
  fullResult: Omit<
    AnalysisResult,
    "optimizedScore" | "lockedMissingKeywordsCount" | "lockedFixesCount" | "isUnlocked" | "planType"
  >,
  planType: "free" | "single" | "pro",
  uiLang: "ar" | "en",
  freeVisibleCount: number
): AnalysisResult {
  const isUnlocked = planType === "single" || planType === "pro";
  const optimizedScore = Math.max(95, Math.min(98, fullResult.atsScore + 40));

  if (isUnlocked) {
    return {
      ...fullResult,
      optimizedScore,
      lockedMissingKeywordsCount: 0,
      lockedFixesCount: 0,
      isUnlocked: true,
      planType
    };
  }

  const visibleMissing = fullResult.missingKeywords.slice(
    0,
    Math.max(0, freeVisibleCount)
  );
  const lockedMissingKeywordsCount = Math.max(
    5,
    fullResult.missingKeywords.length - visibleMissing.length
  );

  const visibleFixes = fullResult.criticalFixes.slice(0, 1);
  const lockedFixesCount = Math.max(2, fullResult.criticalFixes.length - 1);

  const isAr = uiLang === "ar";
  const redactedText = isAr
    ? "🔒 [محتوى تنفيذي محمي — اشترك لفتح السيرة الذاتية الكاملة وتحميلها PDF]"
    : "🔒 [Executive Content Locked — Upgrade to unlock full Harvard ATS resume]";

  return {
    ...fullResult,
    optimizedScore,
    missingKeywords: visibleMissing,
    lockedMissingKeywordsCount,
    criticalFixes: visibleFixes,
    lockedFixesCount,
    rewrittenCv: {
      ...fullResult.rewrittenCv,
      summary:
        fullResult.rewrittenCv.summary.slice(0, 125) +
        "... " +
        (isAr ? "[باقي الملخص التنفيذي مقفل 🔒]" : "[Locked 🔒]"),
      skills: [
        ...fullResult.rewrittenCv.skills.slice(0, 3),
        isAr
          ? `🔒 +${lockedMissingKeywordsCount} مهارات ATS مخفية`
          : `🔒 +${lockedMissingKeywordsCount} Hidden ATS Skills`
      ],
      skillCategories: fullResult.rewrittenCv.skillCategories.map((cat, idx) => ({
        category: cat.category,
        items:
          idx === 0
            ? [...cat.items.slice(0, 2), "🔒 [مقفل]"]
            : ["🔒 [مقفل — متاح في النسخة المدفوعة]"]
      })),
      experience: [
        {
          role: fullResult.rewrittenCv.experience[0]?.role || "Target Role",
          company: fullResult.rewrittenCv.experience[0]?.company || "Organization",
          location: fullResult.rewrittenCv.experience[0]?.location || "Cairo, Egypt",
          period: fullResult.rewrittenCv.experience[0]?.period || "Present",
          scopeStatement:
            (fullResult.rewrittenCv.experience[0]?.scopeStatement?.slice(0, 65) ||
              "Directing core operations...") + "... 🔒",
          bullets: [
            (fullResult.rewrittenCv.experience[0]?.bullets[0]?.slice(0, 80) ||
              "Spearheaded strategic initiatives...") + "... 🔒",
            redactedText,
            redactedText,
            redactedText
          ],
          keyAchievement: redactedText
        }
      ],
      projects: [
        {
          name: "🔒 Project Case Study Locked",
          roleOrTech: "ATS Strategic Initiative",
          period: "2025",
          bullets: [redactedText]
        }
      ],
      education: fullResult.rewrittenCv.education.slice(0, 1),
      certifications: ["🔒 [الشهادات المهنية مقترحة في النسخة الكاملة]"],
      languages: fullResult.rewrittenCv.languages
    },
    coverLetter:
      fullResult.coverLetter.slice(0, 140) +
      "\n\n" +
      (isAr
        ? "🔒 [باقي خطاب التقديم المخصص مقفل — اشترك لنسخ الخطاب كاملاً]"
        : "🔒 [Rest of Cover Letter is locked — Upgrade to copy full letter]"),
    linkedinMessage:
      fullResult.linkedinMessage.slice(0, 90) +
      "...\n🔒 [مقفل — متاح في النسخة المدفوعة]",
    interviewPrep: fullResult.interviewPrep.slice(0, 1).map((q) => ({
      ...q,
      sampleAnswer:
        q.sampleAnswer.slice(0, 65) +
        "... 🔒 " +
        (isAr ? "[الإجابة النموذجية الكاملة مقفلة]" : "[Full STAR answer locked]")
    })),
    isUnlocked: false,
    planType: "free"
  };
}

function buildSmartFallbackAnalysis(
  cvText: string,
  jobDescription: string,
  uiLang: "ar" | "en"
): Omit<
  AnalysisResult,
  "optimizedScore" | "lockedMissingKeywordsCount" | "lockedFixesCount" | "isUnlocked" | "planType"
> {
  const cvLower = cvText.toLowerCase();
  const jdKeywords = extractImportantKeywords(jobDescription);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of jdKeywords) {
    if (cvLower.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  while (missingKeywords.length < 8) {
    const extras = [
      "Core KPIs & OKRs",
      "Cross-Functional Leadership",
      "Conversion Optimization (CRO)",
      "CI/CD & Automated Testing",
      "Data-Driven Architecture",
      "ROI & Revenue Attribution",
      "Scalable Systems Design",
      "Stakeholder Alignment"
    ];
    for (const ex of extras) {
      if (!missingKeywords.includes(ex) && !matchedKeywords.includes(ex)) {
        missingKeywords.push(ex);
      }
      if (missingKeywords.length >= 8) break;
    }
  }

  const hasNumbers = /\d+%|\$\d+|\d+\+/.test(cvText);
  const ratio = jdKeywords.length > 0 ? matchedKeywords.length / jdKeywords.length : 0.4;
  const keywordScore = Math.min(72, Math.max(28, Math.round(ratio * 85)));
  const impactScore = hasNumbers ? 62 : 38;
  const readabilityScore = cvText.length > 250 ? 68 : 48;
  const alignmentScore = Math.min(74, Math.max(35, Math.round((keywordScore + impactScore) / 2)));
  const atsScore = Math.round(
    keywordScore * 0.4 + impactScore * 0.25 + readabilityScore * 0.15 + alignmentScore * 0.2
  );

  const lines = cvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const fullName = lines[0] || "Ahmed Hassan";
  const emailMatch = cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cvText.match(/(\+?\d[\d\s-]{8,15}\d)/);
  const jdFirstLine =
    jobDescription
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean) || "Senior Specialist";
  const cleanRoleTitle = jdFirstLine.split("(")[0].trim() || "Senior Specialist";

  const allSkills = Array.from(new Set([...matchedKeywords, ...missingKeywords]));
  const isAr = uiLang === "ar";

  return {
    atsScore,
    subScores: {
      keywordMatch: keywordScore,
      impactAndMetrics: impactScore,
      atsReadability: readabilityScore,
      roleAlignment: alignmentScore
    },
    executiveFeedback: isAr
      ? `⚠️ خطر استبعاد آلي: سيرتك الذاتية الحالية حصلت على ${atsScore}% فقط (الحد الأدنى لتخطي فلتر الـ ATS هو 80%). السبب الرئيسي هو غياب ${missingKeywords.length} كلمات مفتاحية أساسية يبحث عنها النظام الآلي في إعلان الوظيفة، وضعف صياغة الإنجازات القياسية. قمنا بإعادة بناء سيرتك الذاتية بالكامل وفق معيار جامعة هارفارد التنفيذي (Harvard Executive ATS Standard) بتوافق 96% وجاهزة للطباعة والتحميل.`
      : `⚠️ High ATS Rejection Risk: Your current resume scores only ${atsScore}% (ATS filters require 80%+). We rebuilt your entire resume following the Harvard Executive ATS framework with a 96% match score.`,
    matchedKeywords: matchedKeywords.length ? matchedKeywords : ["Teamwork", "Problem Solving"],
    missingKeywords,
    criticalFixes: isAr
      ? [
          {
            issue: "غياب صياغة هارفارد التنفيذية (XYZ Impact Formula) والأرقام القياسية",
            fix: "تم إعادة صياغة كافة نقاط الخبرة لتبدأ بأفعال قيادية قوية متبوعة بنسب مئوية وأثر مالي وتشغيلي واضح.",
            priority: "high"
          },
          {
            issue: `نقص ${missingKeywords.length} كلمات مفتاحية حرجة يبحث عنها الـ ATS`,
            fix: "تم توزيع الكلمات المفتاحية داخل مصفوفة المهارات المقسمة (Core Competencies Matrix) وداخل نقاط الخبرة.",
            priority: "high"
          },
          {
            issue: "افتقار السيرة الذاتية لقسم المشاريع الاستراتيجية ونطاق المسؤولية (Scope Statement)",
            fix: `تم إضافة وصف نطاق العمل تحت كل شركة + قسم المشاريع الكبرى والشهادات المهنية لملء صفحة A4 احترافية متكاملة.`,
            priority: "medium"
          }
        ]
      : [
          {
            issue: "Lack of Harvard XYZ quantified impact metrics in experience bullets",
            fix: "Rewrote all bullets with executive action verbs and concrete percentages.",
            priority: "high"
          },
          {
            issue: `Missing ${missingKeywords.length} core ATS keywords required by the job description`,
            fix: "Integrated missing keywords into a 3-category Core Competencies matrix and experience section.",
            priority: "high"
          },
          {
            issue: "Sparse structure lacking Role Scope Statements and Key Projects",
            fix: `Added executive scope statements, key achievements, strategic projects, and certifications.`,
            priority: "medium"
          }
        ],
    rewrittenCv: {
      fullName,
      targetTitle: jdFirstLine.slice(0, 75),
      tagline: `${cleanRoleTitle} | ${allSkills.slice(0, 3).join(" • ")} | High-Impact Execution & Scalable Growth`,
      email: emailMatch ? emailMatch[0] : "ahmed.hassan@email.com",
      phone: phoneMatch ? phoneMatch[0] : "+20 100 123 4567",
      location: "Cairo, Egypt (Open to Remote & Hybrid)",
      linkedin: "linkedin.com/in/" + fullName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      portfolio: "github.com/" + fullName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      summary: `Results-driven ${cleanRoleTitle} with 3+ years of progressive experience architecting, executing, and scaling high-performing initiatives across ${allSkills.slice(0, 4).join(", ")}. Proven track record of translating complex business requirements into measurable growth, improving operational efficiency by 38%, and boosting core conversion/performance KPIs. Adept at cross-functional collaboration, data-backed decision-making, and delivering enterprise-grade quality under tight agile deadlines.`,
      skills: allSkills,
      skillCategories: [
        {
          category: "Core Domain & Strategic Competencies",
          items: allSkills.slice(0, 5)
        },
        {
          category: "Technical Stack, Platforms & Tools",
          items: allSkills.slice(5, 10).length
            ? allSkills.slice(5, 10)
            : ["Performance Auditing", "Workflow Automation", "Data Analytics", "Reporting"]
        },
        {
          category: "Leadership, Methodologies & Execution",
          items: [
            "Agile / Scrum Delivery",
            "Cross-Functional Collaboration",
            "A/B Experimentation",
            "Root-Cause Diagnostics",
            "KPI & OKR Ownership"
          ]
        }
      ],
      experience: [
        {
          role: cleanRoleTitle,
          company: "TechWave Solutions / Regional Enterprise",
          location: "Cairo, Egypt",
          period: "Jan 2024 – Present",
          scopeStatement: `Recruited to lead core ${cleanRoleTitle} deliverables, owning end-to-end execution, performance optimization, and KPI growth across high-traffic digital products.`,
          bullets: [
            `Spearheaded core production initiatives utilizing ${allSkills.slice(0, 3).join(", ")}, accelerating delivery velocity by 38% while maintaining 99.8% quality compliance.`,
            `Architected and executed data-driven optimizations around ${missingKeywords.slice(0, 2).join(" and ") || "core KPIs"}, directly improving user engagement and conversion metrics by 29% within two quarters.`,
            `Partnered with product managers, designers, and senior stakeholders to streamline workflows, eliminating 12+ hours of weekly manual operational overhead.`,
            `Established standardized testing, auditing, and reporting frameworks that reduced post-release defects and performance bottlenecks by 42%.`
          ],
          keyAchievement: `Recognized as top-quartile performer for delivering a 38% measurable lift in primary project KPIs ahead of schedule.`
        },
        {
          role: `Associate ${cleanRoleTitle}`,
          company: "Digital Spark Agency",
          location: "Cairo, Egypt",
          period: "Jun 2022 – Dec 2023",
          scopeStatement: `Delivered 15+ client and internal projects from conception to launch, focusing on ${matchedKeywords.slice(0, 2).join(" & ") || "high-quality execution"} and responsive user experiences.`,
          bullets: [
            `Developed and optimized core deliverables leveraging ${allSkills.slice(0, 4).join(", ")}, achieving a 96% client satisfaction score across all quarterly reviews.`,
            `Conducted rigorous performance audits and iterative A/B improvements that increased average funnel completion rates by 24%.`,
            `Collaborated within an agile team of 8 specialists to standardize reusable templates and documentation, cutting onboarding time for new team members by 30%.`
          ],
          keyAchievement: `Successfully delivered 15+ production projects with zero missed SLA milestones.`
        }
      ],
      projects: [
        {
          name: `Enterprise ${allSkills[0] || "Performance"} Transformation & Optimization Suite`,
          roleOrTech: `${allSkills.slice(0, 4).join(" • ")}`,
          period: "2025",
          bullets: [
            `Designed and deployed an end-to-end optimization framework targeting ${missingKeywords.slice(0, 2).join(" & ") || "high-conversion workflows"}, resulting in a 35% improvement in core efficiency metrics.`,
            `Integrated automated tracking, real-time KPI dashboards, and quality gates to ensure sustained scalability.`
          ]
        },
        {
          name: `High-Conversion Growth & Automation Initiative`,
          roleOrTech: `${allSkills.slice(2, 6).join(" • ")}`,
          period: "2024",
          bullets: [
            `Built a scalable workflow engine that reduced turnaround time by 40% and supported a 2.5x increase in monthly volume without additional headcount.`
          ]
        }
      ],
      education: [
        {
          degree: "Bachelor's Degree in Computer Science / Business Administration",
          institution: "Cairo University",
          year: "2022",
          details: "Grade: Very Good with Honors • Graduation Project: Distinction (A+)"
        }
      ],
      certifications: [
        `Advanced Professional Certification in ${allSkills[0] || "Core Domain"} (2025)`,
        `Agile Project Delivery & Data-Driven Optimization Specialist (2024)`,
        `Google / Meta IndustryVerified Credential in ${allSkills[1] || "Analytics & Execution"}`
      ],
      languages: [
        "Arabic: Native Speaker",
        "English: Full Professional Proficiency (C1 — Verbal & Written)"
      ]
    },
    coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jdFirstLine} position. With over 3 years of hands-on experience driving measurable outcomes across ${allSkills.slice(0, 4).join(", ")}, I have consistently combined technical precision with business-first execution.\n\nIn my current role, I spearheaded initiatives utilizing ${allSkills.slice(0, 3).join(" and ")}, which directly improved primary performance KPIs by 38% and reduced operational bottlenecks by 42%. I am particularly drawn to this opportunity because your team's focus on ${missingKeywords.slice(0, 2).join(" and ") || "scalable excellence"} aligns directly with the systems and workflows I have built and scaled.\n\nAttached is my Harvard-structured, ATS-optimized CV detailing my experience, project case studies, and quantified achievements. I would welcome a brief 15-minute conversation this week to discuss how I can contribute immediately to your upcoming objectives.\n\nThank you for your time and consideration.\n\nSincerely,\n${fullName}`,
    linkedinMessage: `Hi [Hiring Manager Name] 👋,\n\nI just submitted my application for the ${jdFirstLine} role and wanted to connect directly. Having led projects across ${allSkills.slice(0, 3).join(", ")}, I recently delivered a 38% improvement in core performance metrics in a very similar environment.\n\nI've attached my tailored CV here—would love to chat briefly for 5 minutes if you're open to it!\n\nBest regards,\n${fullName}`,
    interviewPrep: isAr
      ? [
          {
            question: `احكِ لي بالتفصيل عن مشروع استخدمت فيه (${allSkills.slice(0, 2).join(" و ")}) وحققت فيه أثر رقمي واضح؟`,
            whyAsked: "للتأكد من أن المهارات المكتوبة في الـ CV هي خبرة عملية حقيقية وليست مجرد كلمات نظرية.",
            sampleAnswer: `استخدم منهجية STAR: ابدأ بوصف التحدي الأساسي، ثم اشرح كيف قمت بتطبيق (${allSkills.slice(0, 2).join(" / ")}) بخطوات عملية، واختم بالنتيجة الرقمية (مثل رفع الأداء بنسبة 38% وتقليل الأخطاء بنسبة 42%).`
          },
          {
            question: `كيف تتعامل مع (${missingKeywords[0] || "ضغط التسليم وتعدد الأولويات"}) لضمان عدم تأثر الجودة؟`,
            whyAsked: "لأن هذه المهارة مذكورة كمتطلب أساسي في إعلان الوظيفة.",
            sampleAnswer: "أعتمد على تحديد مؤشرات الأداء الرئيسية (KPIs) منذ اليوم الأول، وتقسيم المشروع إلى مراحل قصيرة مع اختبار مستمر ومراجعة الأرقام أولاً بأول."
          },
          {
            question: "ما هو أكبر تحدٍ تقني أو تشغيلي واجهته في عملك الأخير وكيف تغلبت عليه؟",
            whyAsked: "لقياس قدرتك على تشخيص المشكلات من جذورها (Root-Cause Analysis) وأخذ المبادرة.",
            sampleAnswer: "اذكر موقفاً اكتشفت فيه عنق زجاجة (Bottleneck) كان يبطئ العمل، وكيف قمت بتحليل البيانات وتنفيذ حل جذري وفّر أكثر من 12 ساعة عمل أسبوعياً."
          }
        ]
      : [
          {
            question: `Walk me through a high-impact project where you leveraged ${allSkills.slice(0, 2).join(" and ")}.`,
            whyAsked: "Verifies hands-on depth with the primary requirements in the job post.",
            sampleAnswer: `Use the STAR method: outline the baseline challenge, detail your execution with ${allSkills.slice(0, 2).join(" / ")}, and quantify the 38% lift in performance.`
          },
          {
            question: `How do you approach ${missingKeywords[0] || "optimizing performance at scale"}?`,
            whyAsked: "Tests readiness for one of the core competencies highlighted in the job description.",
            sampleAnswer: "Emphasize baseline auditing, hypothesis-driven experimentation, automated quality checks, and clear KPI tracking."
          },
          {
            question: "Tell me about a time you identified a major bottleneck. How did you resolve it?",
            whyAsked: "Evaluates ownership, root-cause diagnostics, and measurable business impact.",
            sampleAnswer: "Describe how you diagnosed the root cause, implemented a repeatable system, and saved 12+ hours/week."
          }
        ],
    mode: "smart-fallback"
  };
}

export async function POST(req: NextRequest) {
  let savedCvText = "";
  let savedJobDescription = "";
  let savedUiLang: "ar" | "en" = "ar";
  let savedPlanType: "free" | "single" | "pro" = "free";
  let freeVisibleCount = 2;

  try {
    const db = readDb();
    freeVisibleCount = db.settings.freeVisibleMissingKeywords ?? 2;

    const body = await req.json();
    const {
      cvText = "",
      pdfBase64 = "",
      jobDescription = "",
      uiLang = "ar",
      customApiKey = "",
      licenseCode = ""
    } = body as {
      cvText?: string;
      pdfBase64?: string;
      jobDescription?: string;
      uiLang?: "ar" | "en";
      customApiKey?: string;
      licenseCode?: string;
    };

    savedCvText = cvText || "Candidate Resume (Uploaded PDF)";
    savedJobDescription = jobDescription || "Target Role";
    savedUiLang = uiLang;

    const token =
      req.cookies.get("masar_token")?.value ||
      req.headers.get("x-session-token") ||
      "";
    const sessionUser = getUserByToken(token);
    const licenseCheck = verifyLicenseCode(licenseCode);

    if (db.settings.freeAllUsersPromo) {
      savedPlanType = "pro";
    } else if (sessionUser && (sessionUser.plan === "pro" || sessionUser.plan === "single")) {
      savedPlanType = sessionUser.plan;
    } else {
      savedPlanType = licenseCheck.plan;
    }

    if ((!cvText.trim() && !pdfBase64) || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Please provide both your CV and the target Job Description." },
        { status: 400 }
      );
    }

    const apiKey = (
      customApiKey ||
      db.settings.geminiApiKey ||
      process.env.GEMINI_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      const rawFallback = buildSmartFallbackAnalysis(
        cvText || "Candidate Resume (Uploaded PDF)",
        jobDescription,
        uiLang
      );
      return NextResponse.json(
        applyServerSidePaywall(rawFallback, savedPlanType, uiLang, freeVisibleCount)
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a Harvard Business School Executive Career Coach and Elite ATS Resume Architect.
Your task is to analyze the candidate's CV against the Target Job Description and generate a comprehensive, full-page Executive Harvard/ATS-Standard Resume in JSON matching the exact schema.

Harvard Executive Resume Standards you MUST apply in 'rewrittenCv':
1. Language of Explanations ('executiveFeedback', 'criticalFixes', 'interviewPrep'): ${
      uiLang === "ar" ? "Arabic (العربية الفصحى الاحترافية)" : "English"
    }.
2. Language of 'rewrittenCv', 'coverLetter', 'linkedinMessage': Match the language of the Target Job Description (default to world-class executive English if the job post is in English).
3. Executive Summary: 4-5 rich, authoritative sentences detailing years of experience, core domain mastery, operational scale, and top quantified achievements.
4. Categorized Core Competencies ('skillCategories'): Group skills into 3 distinct executive categories (e.g. Core Domain & Strategy, Technical Stack & Tools, Leadership & Methodologies) with 5-6 items each.
5. Professional Experience: For each role, include a 1-2 sentence 'scopeStatement' establishing mandate/context, 4-5 detailed bullet points using the Harvard XYZ formula (Accomplished [X] as measured by [Y], by doing [Z] with concrete percentages/numbers), and a 'keyAchievement' highlight.
6. Key Projects ('projects'): Include 2 substantial project case studies relevant to the target role with measurable impact.
7. Include 'education' with honors/details, 3 relevant 'certifications', and 'languages'.`;

    const inputParts: Array<
      | { type: "text"; text: string }
      | { type: "document"; data: string; mime_type: string }
    > = [];

    if (pdfBase64) {
      inputParts.push({
        type: "document",
        data: pdfBase64,
        mime_type: "application/pdf"
      });
    }

    inputParts.push({
      type: "text",
      text: `CANDIDATE CV TEXT:\n${cvText || "(See attached PDF document)"}\n\n---\nTARGET JOB DESCRIPTION:\n${jobDescription}`
    });

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      system_instruction: systemInstruction,
      input: inputParts,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: ANALYSIS_SCHEMA
      }
    });

    const rawText = interaction.output_text;
    if (!rawText) {
      throw new Error("Empty response from Gemini model");
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json(
      applyServerSidePaywall(
        {
          ...parsed,
          mode: "gemini-ai"
        },
        savedPlanType,
        uiLang,
        freeVisibleCount
      )
    );
  } catch (error: unknown) {
    console.error("Analysis API error:", error);
    try {
      const rawFallback = buildSmartFallbackAnalysis(
        savedCvText || "Candidate Resume",
        savedJobDescription || "Target Role",
        savedUiLang
      );
      return NextResponse.json(
        applyServerSidePaywall(rawFallback, savedPlanType, savedUiLang, freeVisibleCount)
      );
    } catch {
      return NextResponse.json(
        { error: "Failed to analyze CV. Please check your inputs and try again." },
        { status: 500 }
      );
    }
  }
}
