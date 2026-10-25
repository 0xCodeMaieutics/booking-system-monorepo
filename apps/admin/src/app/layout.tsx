import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans_Georgian } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/trpc/client";

const sans = Noto_Sans_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-sans" });

export const metadata: Metadata = {
  title: "ვიზიტა — ადმინისტრატორი",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ka" className={sans.variable}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
