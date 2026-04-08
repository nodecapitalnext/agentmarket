import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayStream — Zincir Üstü Abonelik Protokolü",
  description: "Arc Testnet üzerinde USDC ile tekrarlayan ödemeler",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
