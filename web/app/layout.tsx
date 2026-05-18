import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://cinchpay.app"),
  title: {
    default: "CinchPay — Stablecoin checkout for any website",
    template: "%s · CinchPay",
  },
  description:
    "USDC checkout processor on Arc Network. Drop-in iframe widget, sub-second settlement, 1% fee. Open source and MIT licensed.",
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
    title: "CinchPay — Stablecoin checkout for any website",
    description: "USDC checkout processor on Arc. Drop in, settle in <1s, 1% fee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CinchPay",
    description: "USDC checkout for any website. Sub-second settlement on Arc Network.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Theme bootstrap — runs before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cp-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
