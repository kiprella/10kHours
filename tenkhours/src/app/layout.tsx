import type { Metadata } from "next";
import { Kreon } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";

const kreon = Kreon({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kreon",
});

export const metadata: Metadata = {
  title: "10k Hours",
  description: "Track your journey to mastery",
  icons: [
    { rel: 'icon', url: '/10kHours_logo.png' },
    { rel: 'apple-touch-icon', url: '/10kHours_logo.png' },
    { rel: 'shortcut icon', url: '/10kHours_logo.png' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={kreon.variable}>
      <body className="font-kreon">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
