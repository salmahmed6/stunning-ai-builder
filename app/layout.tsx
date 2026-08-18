import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stunning — Turn your idea into a blueprint",
  description:
    "Describe what you want to build, choose the tools you use, and let AI turn your idea into a practical technical blueprint.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/*
          Fonts are loaded from the CDN rather than `next/font/google` so the
          project builds in offline/CI environments. System fallbacks are
          declared in globals.css.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule targets the Pages Router; this <head> is shared by the whole App Router tree. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
