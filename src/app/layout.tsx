import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://masar-cv-saas.onrender.com"),
  title: "مسارك | Masarak — المنصة الأولى في مصر لفحص السيرة الذاتية ATS وبناء CV هارفارد",
  description:
    "افحص سيرتك الذاتية مجاناً في 10 ثوانٍ، اكتشف نسبة توافقها مع الوظيفة، واستلم CV احترافي بمعيار جامعة هارفارد (عربي وإنجليزي) لتخطي فلاتر الـ ATS بنسبة 96% مع خطاب التقديم وأسئلة الإنترفيو. تفعيل فوري عبر فودافون كاش.",
  keywords: [
    "مسارك",
    "Masarak",
    "عمل CV احترافي",
    "فحص السيرة الذاتية ATS",
    "تصميم سيرة ذاتية هارفارد",
    "CV ATS مصر",
    "فودافون كاش CV",
    "Wuzzuf CV",
    "LinkedIn CV Egypt",
    "Harvard Resume Builder Arabic English"
  ],
  openGraph: {
    title: "مسارك | Masarak — افحص الـ CV مجاناً وابنِ سيرة ذاتية بمعيار جامعة هارفارد (96% ATS)",
    description:
      "75% من السير الذاتية تُرفض آلياً! افحص سيرتك الذاتية مجاناً في 10 ثوانٍ واستلم نسخة Harvard Executive جاهزة للطباعة PDF بالعربي والإنجليزي.",
    url: "https://masar-cv-saas.onrender.com",
    siteName: "مسارك | Masarak",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "مسارك | Masarak — Harvard Executive CV & ATS Suite"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "مسارك | Masarak — صياغة السيرة الذاتية بمعيار جامعة هارفارد وتخطي الـ ATS",
    description:
      "فحص مجاني فوري لدرجة الـ ATS وإعادة صياغة السيرة الذاتية بالعربي والإنجليزي بنسبة قبول 96%.",
    images: ["/og-banner.jpg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className="font-sans min-h-screen bg-[#07070a] text-stone-100">
        {children}
      </body>
    </html>
  );
}
