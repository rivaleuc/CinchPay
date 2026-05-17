import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo shop",
  description:
    "A fictional store wired to live CinchPay checkout on Arc Testnet. Try a real USDC payment in seconds.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
