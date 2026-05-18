"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/cinch/primitives";
import { cn } from "@/lib/cn";
import { newPaymentId, shortAddr } from "@/lib/format";
import { EXPLORER } from "@/lib/contract";

type Stack = "html" | "react" | "shopify" | "wordpress";
type TokenChoice = "USDC" | "EURC";

const STACKS: { id: Stack; label: string; sub: string; lang: string }[] = [
  { id: "html", label: "HTML", sub: "Webflow · Squarespace · Wix", lang: "html" },
  { id: "react", label: "React", sub: "Next.js · Vue · SvelteKit", lang: "jsx" },
  { id: "shopify", label: "Shopify", sub: "Theme Liquid", lang: "liquid" },
  { id: "wordpress", label: "WordPress", sub: "WooCommerce · PHP", lang: "php" },
];

export default function Install() {
  const { address, isConnected } = useAccount();
  const [stack, setStack] = useState<Stack>("html");
  const [amount, setAmount] = useState("29.99");
  const [token, setToken] = useState<TokenChoice>("USDC");
  const [label, setLabel] = useState("Pay 29.99 USDC");
  const [orderId, setOrderId] = useState("ORDER-001");
  const [showOpen, setShowOpen] = useState(false);

  // Default merchant address placeholder until wallet connects
  const merchant = isConnected && address ? address : "0xYourWalletAddress";

  const snippet = useMemo(
    () => buildSnippet({ stack, merchant, amount, token, label, orderId }),
    [stack, merchant, amount, token, label, orderId],
  );

  function openPreview() {
    if (!isConnected || !address) return;
    const url = `/checkout?merchant=${address}&amount=${amount}&token=${token}&orderId=${orderId}&paymentId=${newPaymentId()}`;
    window.open(url, "cinchpay-preview", "width=480,height=760");
    setShowOpen(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-fg)]">
            <Sparkles className="h-3 w-3" />
            Install in 60 seconds
          </div>
          <h1 className="display mt-5 text-4xl md:text-5xl text-balance">
            Add USDC checkout to your site. Right now.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--fg-muted)]">
            Connect a wallet. Pick what you&apos;re building with. Copy the snippet.
            Paste it on any page. You&apos;ll be taking USDC payments in less than a minute.
          </p>
        </div>
      </section>

      {/* Wizard */}
      <section className="mx-auto max-w-5xl px-6 py-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — config */}
        <div className="space-y-6">
          {/* Step 1: Connect */}
          <StepCard n="01" title="Connect your wallet" done={isConnected}>
            {isConnected ? (
              <div className="rounded-md border border-[var(--border)] bg-[var(--paper)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)]">
                    <Wallet className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
                      Your merchant ID
                    </div>
                    <div className="font-mono text-sm font-semibold text-[var(--fg)] break-all">
                      {address}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-[var(--fg-muted)]">
                  Payments will arrive at this address. Funds move wallet-to-wallet,
                  we never custody.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--paper)] p-6 text-center">
                <Wallet className="mx-auto h-6 w-6 text-[var(--fg-muted)]" />
                <p className="mt-3 text-sm text-[var(--fg-muted)]">
                  Your wallet address is your merchant ID. No signup.
                </p>
                <div className="mt-4 flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            )}
          </StepCard>

          {/* Step 2: Configure */}
          <StepCard n="02" title="Configure">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount">
                <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--paper)] px-3 py-2 focus-within:border-[var(--border-strong)] transition-colors">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setLabel(`Pay ${e.target.value} ${token}`);
                    }}
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold tabular text-[var(--fg)]"
                  />
                  <select
                    value={token}
                    onChange={(e) => {
                      const t = e.target.value as TokenChoice;
                      setToken(t);
                      setLabel(`Pay ${amount} ${t}`);
                    }}
                    className="shrink-0 bg-transparent text-xs font-semibold text-[var(--fg-muted)] outline-none cursor-pointer"
                  >
                    <option>USDC</option>
                    <option>EURC</option>
                  </select>
                </div>
              </Field>
              <Field label="Order ID">
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORDER-001"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--border-strong)] transition-colors font-mono"
                />
              </Field>
              <Field label="Button label" className="sm:col-span-2">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--border-strong)] transition-colors"
                />
              </Field>
            </div>
          </StepCard>

          {/* Step 3: Stack */}
          <StepCard n="03" title="Your stack">
            <div className="grid gap-2 grid-cols-2">
              {STACKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStack(s.id)}
                  className={cn(
                    "text-left rounded-md border px-3 py-2.5 transition-colors min-w-0",
                    stack === s.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--paper)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]",
                  )}
                >
                  <div className="text-[13px] font-bold tracking-tight text-[var(--fg)] truncate">
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--fg-muted)] truncate">{s.sub}</div>
                </button>
              ))}
            </div>
          </StepCard>
        </div>

        {/* RIGHT — preview + snippet */}
        <aside className="lg:sticky lg:top-8 lg:self-start space-y-6">
          {/* Live preview */}
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] p-5">
            <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
              Live preview
            </div>
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6 flex items-center justify-center">
              <button
                onClick={openPreview}
                disabled={!isConnected}
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_0_0_1px_oklch(0.62_0.14_240/0.3),0_8px_24px_-8px_oklch(0.62_0.14_240/0.4)] btn-anim disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {label || "Pay"}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-[var(--fg-muted)] leading-relaxed">
              {isConnected
                ? "Click to open the real CinchPay checkout in a popup — it works against your wallet, with testnet USDC."
                : "Connect a wallet to enable the live preview."}
            </p>
            {showOpen && (
              <p className="mt-2 text-[11px] text-[var(--accent)]">
                Preview opened in a new window ✓
              </p>
            )}
          </div>

          {/* Snippet */}
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
                Your snippet · {stack}
              </div>
              <CopyButton text={snippet} />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-[1.65] text-[var(--fg)] max-h-[420px]">
              <code>{snippet}</code>
            </pre>
          </div>

          {/* What's next */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-5 text-sm space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
              What&apos;s next
            </div>
            <NextLink href="/integrate#webhooks" label="Set up backend fulfillment" />
            <NextLink href="/m" label="Track payments in your dashboard" />
            <NextLink href="/demo" label="See a working storefront" />
          </div>
        </aside>
      </section>

      <Footer />
    </>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────

function StepCard({
  n,
  title,
  done,
  children,
}: {
  n: string;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
            done
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--fg-muted)] border border-[var(--border)]",
          )}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
        </span>
        <h2 className="text-[17px] font-bold tracking-tight text-[var(--fg)] leading-none">
          {title}
        </h2>
      </div>
      <div className="mt-3 ml-0 sm:ml-9">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-bold block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
        copied
          ? "bg-[var(--accent-soft)] text-[var(--accent-fg)]"
          : "bg-[var(--bg)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)]",
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy snippet"}
    </button>
  );
}

function NextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5 arrow-nudge" />
    </Link>
  );
}

function buildSnippet({
  stack,
  merchant,
  amount,
  token,
  label,
  orderId,
}: {
  stack: Stack;
  merchant: string;
  amount: string;
  token: string;
  label: string;
  orderId: string;
}): string {
  const order = orderId || "ORDER-001";

  if (stack === "html") {
    return `<!-- 1. Load the CinchPay script anywhere in your page -->
<script src="https://cinchpay.app/v1.js"></script>

<!-- 2. Drop in a button — data-attributes are auto-bound -->
<button
  data-cinchpay
  data-merchant="${merchant}"
  data-amount="${amount}"
  data-token="${token}"
  data-order-id="${order}"
  style="background:#3b6fe6;color:#fff;padding:12px 20px;border:0;border-radius:8px;font-weight:700;cursor:pointer;"
>
  ${label}
</button>`;
  }

  if (stack === "react") {
    return `// 1. Add the script once in your root layout (Next.js: app/layout.tsx)
<script src="https://cinchpay.app/v1.js" async />

// 2. Use it in any component
"use client";

export function PayButton() {
  function pay() {
    window.CinchPay.open({
      merchant: "${merchant}",
      amount: ${amount},
      token: "${token}",
      orderId: "${order}",
      onSuccess: ({ txHash, paymentId }) => {
        // Mark the order as paid in your backend
        fetch("/api/orders/fulfill", {
          method: "POST",
          body: JSON.stringify({ paymentId, txHash }),
        });
      },
      onClose: () => console.log("Customer cancelled"),
    });
  }

  return (
    <button onClick={pay} className="bg-blue-600 text-white px-5 py-3 rounded-md">
      ${label}
    </button>
  );
}`;
  }

  if (stack === "shopify") {
    return `{%- comment -%}
  Add this anywhere in your theme — product.liquid, cart.liquid, or a custom section.
  Pulls product price + ID automatically from the Liquid context.
{%- endcomment -%}

<script src="https://cinchpay.app/v1.js"></script>

<button
  data-cinchpay
  data-merchant="${merchant}"
  data-amount="{{ product.price | divided_by: 100.0 }}"
  data-token="${token}"
  data-order-id="{{ product.id }}-{{ 'now' | date: '%s' }}"
  class="btn btn--full"
  style="background:#3b6fe6;color:#fff;"
>
  Pay {{ product.price | money }} in ${token}
</button>`;
  }

  // wordpress
  return `<?php
/**
 * Add the CinchPay button under WooCommerce's "Add to cart".
 * Drop this in your theme's functions.php (or a custom plugin).
 */
add_action( 'woocommerce_after_add_to_cart_button', function() {
    global $product;
    $merchant = '${merchant}';
    $amount   = $product->get_price();
    $order_id = $product->get_id() . '-' . time();
    ?>
    <script src="https://cinchpay.app/v1.js"></script>
    <button
      data-cinchpay
      data-merchant="<?php echo esc_attr( $merchant ); ?>"
      data-amount="<?php echo esc_attr( $amount ); ?>"
      data-token="${token}"
      data-order-id="<?php echo esc_attr( $order_id ); ?>"
      style="background:#3b6fe6;color:#fff;padding:12px 20px;border:0;border-radius:8px;font-weight:700;cursor:pointer;margin-top:12px;"
    >
      ${label}
    </button>
    <?php
} );`;
}
