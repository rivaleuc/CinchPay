import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay with USDC on Arc Network. Atomic settlement in under a second.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
