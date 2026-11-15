export interface SamplePreset {
  id: string;
  labelAr: string;
  labelEn: string;
  cvText: string;
  jobDescription: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "frontend-dev",
    labelAr: "مطور واجهات أمامية (Frontend Developer)",
    labelEn: "Frontend Developer (React / Next.js)",
    cvText: `Ahmed Hassan
Cairo, Egypt | ahmed.hassan.dev@email.com | +20 100 123 4567 | linkedin.com/in/ahmedhassan

Summary:
Frontend web developer with 2.5 years of experience building websites and web apps. Good team player looking for a challenging role.

Experience:
Frontend Developer - TechWave Solutions (2024 - Present)
- Built user interfaces using React.js and Tailwind CSS.
- Worked with backend developers to integrate REST APIs.
- Fixed bugs and improved website speed.

Junior Web Developer - Digital Spark Agency (2022 - 2024)
- Created landing pages using HTML, CSS, JavaScript.
- Made responsive designs for mobile and desktop.

Education:
B.Sc. in Computer Science, Cairo University (2022)

Skills:
HTML, CSS, JavaScript, React, Git, Tailwind CSS`,
    jobDescription: `Senior / Mid-Level Frontend Engineer (React & Next.js)
Location: Hybrid (Cairo / Remote)

We are seeking a results-driven Frontend Engineer to build scalable SaaS dashboards.
Requirements:
- 2+ years of production experience with React.js, Next.js (App Router), and TypeScript.
- Strong understanding of Core Web Vitals, performance optimization, and SSR/ISR.
- Experience with state management (Zustand / Redux), Tailwind CSS, and REST/GraphQL APIs.
- Proven track record of improving conversion rates or load times with measurable metrics.
- Familiarity with CI/CD pipelines, unit testing (Jest / Playwright), and Agile workflows.`
  },
  {
    id: "digital-marketing",
    labelAr: "أخصائي تسويق رقمي (Performance Marketing)",
    labelEn: "Performance Marketing Specialist",
    cvText: `Sara Mahmoud
Giza, Egypt | sara.marketing@email.com | +20 111 987 6543 | linkedin.com/in/saramahmoud

Objective:
Digital Marketer with 3 years of experience managing social media ads and content campaigns. Passionate about helping brands grow.

Work Experience:
Digital Marketing Specialist - Nile E-Commerce (2023 - Present)
- Managed Facebook and Instagram ad campaigns for fashion and beauty clients.
- Created monthly reports for clients showing clicks and impressions.
- Coordinated with graphic designers to create social media posts.

Social Media Coordinator - Creative Pulse (2021 - 2023)
- Scheduled posts and replied to customer messages.
- Boosted posts on Meta Business Suite.

Education:
B.Com in Business Administration, Ain Shams University (2021)

Skills:
Facebook Ads, Instagram, Content Creation, Canva, Copywriting`,
    jobDescription: `Performance Marketing Specialist (E-Commerce & Growth)
We are looking for a data-driven Performance Media Buyer to scale our regional e-commerce brands across Egypt and GCC.

Key Responsibilities & Skills:
- Manage paid acquisition across Meta Ads, TikTok Ads, and Google Ads (Search, PMax).
- Optimize campaigns for ROAS, CPA, CAC, and conversion funnel metrics.
- Implement tracking pixels, Meta Conversion API (CAPI), Google Analytics 4 (GA4), and Google Tag Manager (GTM).
- Run A/B testing on ad creatives, hooks, and landing pages to improve CTR and CVR.
- Manage monthly ad budgets exceeding $20,000+ with clear ROI reporting.`
  }
];
