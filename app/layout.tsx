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

export const metadata = {
  title: "Embr Core",
  description:
    "Embr creates professional business apps, proposals, plans, dashboards, and project assets from plain English.",
  openGraph: {
    title: "Embr Core",
    description:
      "Create professional business apps, proposals, plans, dashboards, and project assets from plain English.",
    url: "https://embrcore.com",
    siteName: "Embr Core",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Embr Core",
    description:
      "Create professional business apps, proposals, plans, dashboards, and project assets from plain English.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
