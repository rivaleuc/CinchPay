"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Pill } from "@/components/cinch/primitives";
import { EXPLORER, PROCESSOR_ADDRESS, TOKENS } from "@/lib/contract";
import { usePayments, type PaymentLog } from "@/lib/usePayments";
import { formatAmount, shortAddr, timeAgo, bytes32ToShortString } from "@/lib/format";
import { cn } from "@/lib/cn";

type TokenFilter = "all" | "USDC" | "EURC";
type Range = "24H" | "7D" | "30D" | "All";

function tokenMeta(addr: `0x${string}`) {
  for (const t of Object.values(TOKENS)) {
    if (t.address.toLowerCase() === addr.toLowerCase()) return t;
  }
  return { symbol: "???", decimals: 18, address: addr };
}

export default function MerchantPage() {
  const params = useParams<{ address: string }>();
  const merchant = params?.address as `0x${string}` | undefined;
  const valid = merchant && isAddress(merchant);

  const { address: connected } = useAccount();
  const isOwn = connected?.toLowerCase() === merchant?.toLowerCase();

  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [range, setRange] = useState<Range>("30D");

  const { payments, loading, error } = usePayments(valid ? merchant : undefined, refreshKey);

  const filtered = useMemo(() => {
    let list = payments;
    if (tokenFilter !== "all") {
      const addr = TOKENS[tokenFilter].address.toLowerCase();
      list = list.filter((p) => p.token.toLowerCase() === addr);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const order = bytes32ToShortString(p.metadata).toLowerCase();
        return (
          p.payer.toLowerCase().includes(q) ||
          p.txHash.toLowerCase().includes(q) ||
          order.includes(q)
        );
      });
    }
    return list;
  }, [payments, tokenFilter, query]);

  const totals = useMemo(() => {
    const acc: Record<string, { symbol: string; decimals: number; net: bigint; count: number }> = {};
    let totalCount = 0;
    let totalNetUsd = 0;
    for (const p of payments) {
      const t = tokenMeta(p.token);
      const k = `${t.symbol}|${t.decimals}`;
      if (!acc[k]) acc[k] = { symbol: t.symbol, decimals: t.decimals, net: 0n, count: 0 };
      acc[k].net += p.netAmount;
      acc[k].count += 1;
      totalCount += 1;
      totalNetUsd += Number(formatAmount(p.netAmount, t.decimals).replace(/,/g, ""));
    }
    return {
      entries: Object.values(acc),
      totalCount,
      avg: totalCount > 0 ? totalNetUsd / totalCount : 0,
    };
  }, [payments]);

  if (!valid) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="mt-4 font-serif text-2xl">Invalid address</h2>
          <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
            <code className="font-mono text-[var(--fg)]">{merchant}</code> isn&apos;t a valid Ethereum address.
          </p>
        </div>
      </div>
    );
  }

  function copy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/checkout?merchant=${merchant}&amount=10&token=USDC`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function exportCsv() {
    if (!filtered.length) return;
    const headers = [
      "block",
      "timestamp_utc",
      "payer",
      "token",
      "token_symbol",
      "gross",
      "net",
      "fee",
      "payment_id",
      "order_id",
      "tx_hash",
    ];
    const rows = filtered.map((p) => {
      const t = tokenMeta(p.token);
      const ts = p.timestamp ? new Date(p.timestamp * 1000).toISOString() : "";
      return [
        p.blockNumber.toString(),
        ts,
        p.payer,
        p.token,
        t.symbol,
        formatAmount(p.grossAmount, t.decimals),
        formatAmount(p.netAmount, t.decimals),
        formatAmount(p.fee, t.decimals),
        p.paymentId,
        bytes32ToShortString(p.metadata),
        p.txHash,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => {
            const s = String(c);
            return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinchpay_${merchant!.slice(0, 6)}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const settledUsdc =
    totals.entries.find((e) => e.symbol === "USDC")?.net ?? 0n;
  const usdcDecimals =
    totals.entries.find((e) => e.symbol === "USDC")?.decimals ?? 6;

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          Merchant dashboard
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="editorial-display text-5xl">
            {isOwn ? "Your storefront" : "Merchant"}
          </h1>
          <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--paper)] px-3 py-1.5 font-mono text-xs tabular hover:border-[var(--border-strong)] transition-colors">
            <span>{shortAddr(merchant)}</span>
            {isOwn && <Pill className="ml-1">You</Pill>}
            <button
              onClick={copy}
              className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check className="h-3 w-3 text-[var(--accent)]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden md:grid-cols-4">
          <Kpi
            label="Settled (USDC)"
            value={formatAmount(settledUsdc, usdcDecimals)}
            sub="all-time"
          />
          <Kpi label="Transactions" value={totals.totalCount.toString()} sub="all-time" />
          <Kpi
            label="Avg. ticket"
            value={totals.avg > 0 ? `$${totals.avg.toFixed(2)}` : "—"}
            sub="USDC"
          />
          <Kpi label="Avg. settle" value="<1s" sub="block to ack" />
        </div>
      </section>

      {/* Volume placeholder + range */}
      <section className="mx-auto max-w-6xl px-6 mt-10">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--paper)] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
                Volume
              </div>
              <div className="font-serif text-2xl mt-1">
                {range === "24H"
                  ? "Last 24 hours"
                  : range === "7D"
                    ? "Last 7 days"
                    : range === "30D"
                      ? "Last 30 days"
                      : "All time"}
              </div>
            </div>
            <div className="flex gap-1 text-xs">
              {(["24H", "7D", "30D", "All"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded px-3 py-1 chip-anim",
                    range === r
                      ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Chart payments={payments} />
        </div>
      </section>

      {/* Table */}
      <section className="mx-auto max-w-6xl px-6 mt-10 pb-24">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--paper)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
                Activity
              </div>
              <div className="font-serif text-2xl mt-1">Recent payments</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] p-0.5">
                {(["all", "USDC", "EURC"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTokenFilter(t)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded chip-anim",
                      tokenFilter === t
                        ? "bg-[var(--surface)] text-[var(--fg)]"
                        : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                    )}
                  >
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 hover:border-[var(--border-strong)] transition-colors">
                <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by tx, order…"
                  className="bg-transparent text-sm outline-none placeholder:text-[var(--fg-muted)] w-44 md:w-56"
                />
              </div>
              <button
                onClick={exportCsv}
                disabled={!filtered.length}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-anim"
              >
                <Download className="h-3 w-3" />
                CSV
              </button>
              <button
                onClick={refresh}
                className="group inline-flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors px-1"
              >
                <RefreshCw
                  className={cn("h-3 w-3", loading ? "spin-slow" : "icon-spin-hover")}
                />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="p-6 text-sm text-red-700">{error}</div>
          ) : loading && !payments.length ? (
            <SkeletonTable />
          ) : payments.length === 0 ? (
            <EmptyState merchant={merchant} />
          ) : filtered.length === 0 ? (
            <NoMatches onClear={() => { setQuery(""); setTokenFilter("all"); }} />
          ) : (
            <PaymentsTable payments={filtered} />
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="stat-hover bg-[var(--paper)] px-6 py-6">
      <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">{label}</div>
      <div className="stat-value mt-2 font-serif text-3xl tabular">{value}</div>
      <div className="text-[11px] text-[var(--fg-muted)]">{sub}</div>
    </div>
  );
}

function PaymentsTable({ payments }: { payments: PaymentLog[] }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] border-b border-[var(--border)]">
            <th className="text-left font-medium px-6 py-3">Status</th>
            <th className="text-left font-medium px-6 py-3">Customer</th>
            <th className="text-left font-medium px-6 py-3">Order</th>
            <th className="text-left font-medium px-6 py-3">Time</th>
            <th className="text-right font-medium px-6 py-3">Amount</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const t = tokenMeta(p.token);
            const order = bytes32ToShortString(p.metadata);
            return (
              <tr
                key={p.txHash + p.paymentId}
                className="row-hover border-b border-[var(--border)] last:border-0"
              >
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--fg)]">
                    <ArrowDownRight className="h-3 w-3 text-[var(--accent)]" />
                    Settled
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--fg-muted)]">
                  {shortAddr(p.payer)}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--fg-muted)]">
                  {order || "—"}
                </td>
                <td className="px-6 py-4 text-[var(--fg-muted)]">
                  {p.timestamp ? timeAgo(p.timestamp) : "—"}
                </td>
                <td className="px-6 py-4 text-right font-mono tabular">
                  {formatAmount(p.netAmount, t.decimals)}{" "}
                  <span className="text-[10px] text-[var(--fg-muted)]">{t.symbol}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <a
                    href={`${EXPLORER}/tx/${p.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] btn-anim"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Chart({ payments }: { payments: PaymentLog[] }) {
  // Bucket payments into ~30 bars by relative position
  const bars = useMemo(() => {
    if (!payments.length) return Array(30).fill(0) as number[];
    const slots = Array(30).fill(0) as number[];
    const sorted = payments.slice().reverse(); // oldest first
    sorted.forEach((p, i) => {
      const idx = Math.floor((i / sorted.length) * 30);
      const t = tokenMeta(p.token);
      slots[Math.min(idx, 29)] += Number(formatAmount(p.netAmount, t.decimals).replace(/,/g, ""));
    });
    return slots;
  }, [payments]);
  const max = Math.max(...bars, 1);
  return (
    <div className="mt-6 flex h-40 items-end gap-1">
      {bars.map((b, i) => (
        <div
          key={i}
          className="group flex-1 rounded-sm bg-[var(--accent-soft)] hover:bg-[var(--accent)] transition-colors"
          style={{ height: `${Math.max((b / max) * 100, 4)}%` }}
          title={b > 0 ? `$${b.toFixed(2)}` : "no payments"}
        />
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-6 py-4">
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--border)]" />
          <div className="ml-auto h-3 w-20 animate-pulse rounded bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <h3 className="font-serif text-xl">Nothing matches</h3>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">Try a different search or token.</p>
      <button
        onClick={onClear}
        className="mt-4 text-sm text-[var(--accent)] hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

function EmptyState({ merchant }: { merchant: `0x${string}` }) {
  return (
    <div className="px-6 py-16 text-center">
      <h3 className="font-serif text-2xl">No payments yet</h3>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Share a checkout link or embed the widget. Payments appear here instantly.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a
          href={`/checkout?merchant=${merchant}&amount=10&token=USDC&orderId=TEST_001`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] btn-anim"
        >
          Test a payment
        </a>
        <a
          href="/integrate"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface)] transition-colors btn-anim"
        >
          Integration docs
        </a>
      </div>
    </div>
  );
}
