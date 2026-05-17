import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant dashboard",
  description:
    "Track payments received through CinchPay. Your wallet address is your merchant ID — no signup required.",
};

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
