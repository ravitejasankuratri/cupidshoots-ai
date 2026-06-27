import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CupidShoots.ai — Anonymous compliments. Real connections.",
  description:
    "Join a singles meetup event with your 6-character code and send anonymous compliments that spark real connections.",
};

export const viewport: Viewport = {
  themeColor: "#e6336b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full bg-background antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
