import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Inflation Calculator — India",
  description:
    "Estimate your household's personal inflation by reweighting official Indian CPI components (base 2024=100) with your own spending mix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
