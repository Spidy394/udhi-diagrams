import type { Metadata } from "next";

import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Science Diagram Maker",
  description:
    "AI-powered animated GCSE science diagram generation, validation and human review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geist.className} antialiased`}
      >
        {children}

        <Toaster
          position="bottom-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
