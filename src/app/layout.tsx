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
  title: "Masar AI | مُحسِّن السيرة الذاتية الذكي وتخطي الـ ATS",
  description:
    "افحص سيرتك الذاتية مجاناً، اكتشف نسبة توافقها مع الوظيفة، واحصل على نسخة CV معدلة لتخطي نظام الـ ATS مع خطاب التقديم وأسئلة الإنترفيو المتوقعة."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className="font-sans min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
