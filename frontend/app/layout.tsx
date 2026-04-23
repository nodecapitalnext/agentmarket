import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentMarket — AI Agent API Marketplace",
  description: "AI agents buy and sell data in real time. Per-action USDC payments via Circle Nanopayments on Arc Testnet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
