import Link from "next/link";
import { Logo } from "@/components/cinch/primitives";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-32">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-[var(--fg-muted)] leading-relaxed">
              Stablecoin checkout for any website. Built on Arc, the Layer-1 by Circle.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              ["Checkout", "/checkout?merchant=0xD140&amount=10&token=USDC"],
              ["Demo shop", "/demo"],
              ["Dashboard", "/m"],
            ]}
          />
          <FooterCol
            title="Developers"
            links={[
              ["Documentation", "/integrate"],
              ["GitHub", "https://github.com/rivaleuc/CinchPay"],
              ["Contract", "https://testnet.arcscan.app/address/0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36"],
            ]}
          />
          <FooterCol
            title="Network"
            links={[
              ["Arc Network", "https://arc.network"],
              ["Circle", "https://www.circle.com"],
              ["Faucet", "https://faucet.circle.com"],
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border)] pt-6 text-xs text-[var(--fg-muted)] md:flex-row md:justify-between">
          <span>© 2026 CinchPay Labs. Open source, MIT licensed.</span>
          <span className="font-mono">Settles in &lt;1s on Arc, 1% processor fee</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-[var(--fg)]">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-[var(--fg-muted)]">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("http") ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="link-grow hover:text-[var(--fg)] transition-colors"
              >
                {label}
              </a>
            ) : (
              <Link
                href={href}
                className="link-grow hover:text-[var(--fg)] transition-colors"
              >
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
