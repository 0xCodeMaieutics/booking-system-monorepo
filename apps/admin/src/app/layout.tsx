import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/trpc/client";

const sans = Noto_Sans_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-sans" });
const serif = Noto_Serif_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-serif" });

export const metadata: Metadata = {
  title: "ფეისი — ადმინისტრატორი",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ka" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
