import EmbrClientShellActions from "@/components/EmbrClientShellActions";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://embrintelligence.com"),
  title: {
    default: "Embr Intelligence | Multi-Model Orchestration",
    template: "%s | Embr Intelligence",
  },
  description:
    "Embr Intelligence is the intelligence layer between people, AI models, and business systems—automatically selecting the right models, tools, workflows, context, and reasoning for every task.",
  openGraph: {
    title: "Embr Intelligence | Multi-Model Orchestration",
    description:
      "The intelligence layer between people, AI models, and business systems. Embr automatically routes every task to the right intelligence, tools, context, and workflow.",
    url: "https://embrintelligence.com",
    siteName: "Embr Intelligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Embr Intelligence | Multi-Model Orchestration",
    description:
      "The intelligence layer that selects the right models, tools, workflows, context, and reasoning for every task.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><EmbrClientShellActions />
        {children}</body>
    </html>
  );
}
