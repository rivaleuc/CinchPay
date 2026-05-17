"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wallet,
  AlertCircle,
  Search,
  Download,
} from "lucide-react";
import { Button, Label, Pill } from "@/components/cinch/primitives";
import { EXPLORER, PROCESSOR_ADDRESS, TOKENS } from "@/lib/contract";
import { usePayments, type PaymentLog } from "@/lib/usePayments";
import { formatAmount, shortAddr, timeAgo, bytes32ToShortString } from "@/lib/format";
import { cn } from "@/lib/cn";

type TokenFilter = "all" | "USDC" | "EURC";

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
    for (const p of payments) {
      const t = tokenMeta(p.token);
      const k = `${t.symbol}|${t.decimals}`;
      if (!acc[k]) acc[k] = { symbol: t.symbol, decimals: t.decimals, net: 0n, count: 0 };
      acc[k].net += p.netAmount;
      acc[k].count += 1;
    }
    return Object.values(acc);
  }, [payments]);

  if (!valid) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-2xl border border-red-500/20 bg-[#0c0e11] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/5">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-medium tracking-tight text-zinc-100">Invalid address</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            <code className="font-mono text-zinc-400">{merchant}</code> isn&apos;t a valid Ethereum address.
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
      "gross_amount",
      "net_amount",
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
          .map((cell) => {
            const s = String(cell);
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#11141a] to-[#0c0e11]">
        <div className="absolute inset-0 bg-dots opacity-50" />
        <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Label>Merchant</Label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] shrink-0">
                <Wallet className="h-4 w-4 text-zinc-300" />
              </div>
              <span className="break-all font-mono text-base text-zinc-100 md:text-lg">
                {merchant}
              </span>
              {isOwn && (
                <Pill className="border-[#5b8cff]/30 bg-[#5b8cff]/10 text-[#5b8cff]">You</Pill>
              )}
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-xs text-zinc-500">
              <span>Contract: {shortAddr(PROCESSOR_ADDRESS)}</span>
              <a
                href={`${EXPLORER}/address/${PROCESSOR_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy sample checkout link"}
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "spin-slow" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-3">
        <Stat label="Payments" value={payments.length.toString()} accent />
        {totals[0] ? (
          <Stat
            label={`Received (${totals[0].symbol})`}
            value={formatAmount(totals[0].net, totals[0].decimals)}
            sub={`${totals[0].count} payment${totals[0].count === 1 ? "" : "s"}`}
          />
        ) : (
          <Stat label="Received (USDC)" value="0" sub="No payments" />
        )}
        {totals[1] ? (
          <Stat
            label={`Received (${totals[1].symbol})`}
            value={formatAmount(totals[1].net, totals[1].decimals)}
            sub={`${totals[1].count} payment${totals[1].count === 1 ? "" : "s"}`}
          />
        ) : (
          <Stat label="Received (EURC)" value="0" sub="No payments" />
        )}
      </div>

      {/* Filters + payments */}
      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-medium tracking-tight text-zinc-100">Payments</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
              {(["all", "USDC", "EURC"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTokenFilter(t)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                    tokenFilter === t
                      ? "bg-white/[0.08] text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search payer, order, tx…"
                className="w-full sm:w-64 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 pl-8 pr-3 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-white/20 outline-none transition"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={!filtered.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:border-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export filtered payments as CSV"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors px-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "spin-slow" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            {error}
          </div>
        ) : loading && !payments.length ? (
          <SkeletonTable />
        ) : payments.length === 0 ? (
          <EmptyState merchant={merchant} />
        ) : filtered.length === 0 ? (
          <NoMatches onClear={() => { setQuery(""); setTokenFilter("all"); }} />
        ) : (
          <PaymentsTable payments={filtered} />
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0c0e11] p-6">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
      <div
        className={cn(
          "mt-3 tabular text-2xl font-semibold tracking-tight truncate",
          accent ? "text-[#5b8cff]" : "text-zinc-100",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-zinc-600">{sub}</div>}
    </div>
  );
}

function PaymentsTable({ payments }: { payments: PaymentLog[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <Th>Payer</Th>
            <Th right>Gross</Th>
            <Th right>Net</Th>
            <Th>Order</Th>
            <Th>Age</Th>
            <Th right>Tx</Th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const t = tokenMeta(p.token);
            const orderId = bytes32ToShortString(p.metadata);
            return (
              <tr
                key={p.txHash + p.paymentId}
                className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
              >
                <Td>
                  <span className="font-mono text-zinc-300">{shortAddr(p.payer)}</span>
                </Td>
                <Td right>
                  <span className="tabular text-zinc-300">
                    {formatAmount(p.grossAmount, t.decimals)}{" "}
                    <span className="text-[10px] text-zinc-600">{t.symbol}</span>
                  </span>
                </Td>
                <Td right>
                  <span className="tabular text-emerald-400">
                    {formatAmount(p.netAmount, t.decimals)}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-zinc-500">{orderId || "—"}</span>
                </Td>
                <Td>
                  <span className="text-zinc-500">
                    {p.timestamp ? timeAgo(p.timestamp) : "—"}
                  </span>
                </Td>
                <Td right>
                  <a
                    href={`${EXPLORER}/tx/${p.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500",
        right && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={cn("px-4 py-3", right && "text-right")}>{children}</td>;
}

function SkeletonTable() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] bg-[#0a0c0f]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <div className="h-3 w-32 animate-pulse rounded bg-white/[0.04]" />
          <div className="ml-auto h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
      <h3 className="text-[14px] font-medium tracking-tight text-zinc-100">Nothing matches</h3>
      <p className="mt-1 text-[12px] text-zinc-500">Try a different search or token.</p>
      <button
        onClick={onClear}
        className="mt-4 text-[12px] text-[#5b8cff] hover:underline underline-offset-2"
      >
        Clear filters
      </button>
    </div>
  );
}

function EmptyState({ merchant }: { merchant: `0x${string}` }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-14 text-center">
      <h3 className="text-[15px] font-medium tracking-tight text-zinc-100">No payments yet</h3>
      <p className="mt-1 text-[13px] text-zinc-500">
        Share a checkout link or embed the widget. Payments appear here instantly.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <a
          href={`/checkout?merchant=${merchant}&amount=10&token=USDC&orderId=TEST_001`}
          target="_blank"
          rel="noreferrer"
        >
          <Button>Test a payment</Button>
        </a>
        <a href="/integrate">
          <Button variant="outline">Integration docs</Button>
        </a>
      </div>
    </div>
  );
}
