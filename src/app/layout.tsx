import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "ResumeFit AI — Ethical ATS Resume Tailoring",
  description:
    "Tailor your resume to any job description with AI — ATS-friendly, keyword-optimized, and truthful. Your real experience, presented at its best.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
