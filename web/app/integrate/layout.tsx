import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integration docs",
  description:
    "Three ways to integrate CinchPay: hosted link, embedded iframe, or modal with postMessage callbacks.",
};

export default function IntegrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
