import type { Metadata } from "next";
import { Fira_Code, Space_Grotesk } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
});

const codeFont = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-code",
});

export const metadata: Metadata = {
  title: "AthenaOps - AI Powered DevOps Assistant",
  description:
    "Automatically generate Dockerfiles, CI/CD pipelines, and Kubernetes configs for your GitHub repositories.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${codeFont.variable}`}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
