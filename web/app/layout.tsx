import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cinchpay.app"),
  title: {
    default: "CinchPay — Stablecoin checkout for any site",
    template: "%s · CinchPay",
  },
  description:
    "Drop-in USDC checkout for any website. Sub-second settlement on Arc Network. Webhook-driven, open source.",
  keywords: [
    "USDC checkout",
    "stablecoin payments",
    "Arc Network",
    "crypto payment processor",
    "Stripe alternative crypto",
  ],
  authors: [{ name: "rivaleuc", url: "https://github.com/rivaleuc" }],
  openGraph: {
    type: "website",
    siteName: "CinchPay",
    title: "CinchPay — Stablecoin checkout for any site",
    description:
      "Drop-in USDC checkout for any website. Sub-second settlement on Arc Network.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CinchPay — Stablecoin checkout for any site",
    description: "5 lines of code. USDC settles in under a second on Arc Network.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)]">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
