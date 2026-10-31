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
  title: "3J Industrial Parts LLC — OS Command Center & Field Operations Platform",
  description:
    "SPARE PARTS | SERVICES | CONSULTING — Unified OS Command Center (os.3jindustrialparts.com) & Field App (app.3jindustrialparts.com) for 3J Industrial Parts LLC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-[#5ADCC8] selection:text-black">
        {children}
      </body>
    </html>
  );
}
