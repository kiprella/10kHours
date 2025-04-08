import type { Metadata } from "next";
import { Kreon } from "next/font/google";
import "./globals.css";

const kreon = Kreon({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kreon",
});

export const metadata: Metadata = {
  title: "10k Hours",
  description: "Track your journey to mastery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={kreon.variable}>
      <body className="font-kreon">{children}</body>
    </html>
  );
}
