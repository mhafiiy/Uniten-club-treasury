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
  title: { default: "UNITEN Smart Treasury", template: "%s · UNITEN Smart Treasury" },
  description: "Club financial management and auditing for UNITEN student organisations.",
  applicationName: "UNITEN Smart Treasury",
  openGraph: { title: "UNITEN Smart Treasury", description: "Transparent, audit-ready club finances.", type: "website" },
};

export const viewport = { themeColor: "#2453c9" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
