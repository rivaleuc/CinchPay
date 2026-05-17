"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { Copy, Check, ExternalLink, RefreshCw, Wallet, AlertCircle } from "lucide-react";
import { Button, Label, Pill } from "@/components/cinch/primitives";
import { EXPLORER, PROCESSOR_ADDRESS, TOKENS } from "@/lib/contract";
import { usePayments, type PaymentLog } from "@/lib/usePayments";
import { formatAmount, shortAddr, timeAgo, bytes32ToShortString } from "@/lib/format";

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
  const { payments, loading, error } = usePayments(valid ? merchant : undefined, refreshKey);

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

  // aggregate stats
  const totals = payments.reduce(
    (acc, p) => {
      const t = tokenMeta(p.token);
      const k = `${t.symbol}|${t.decimals}`;
      if (!acc[k]) acc[k] = { symbol: t.symbol, decimals: t.decimals, net: 0n };
      acc[k].net += p.netAmount;
      return acc;
    },
    {} as Record<string, { symbol: string; decimals: number; net: bigint }>,
  );
  const statEntries = Object.values(totals).slice(0, 2);

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
                <Pill className="border-[#5b8cff]/30 bg-[#5b8cff]/10 text-[#5b8cff]">
                  You
                </Pill>
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
        {statEntries[0] ? (
          <Stat
            label={`Received (${statEntries[0].symbol})`}
            value={formatAmount(statEntries[0].net, statEntries[0].decimals)}
          />
        ) : (
          <Stat label="Received (USDC)" value="0" />
        )}
        {statEntries[1] ? (
          <Stat
            label={`Received (${statEntries[1].symbol})`}
            value={formatAmount(statEntries[1].net, statEntries[1].decimals)}
          />
        ) : (
          <Stat label="Received (EURC)" value="0" />
        )}
      </div>

      {/* Recent payments */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium tracking-tight text-zinc-100">
            Recent payments
          </h2>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "spin-slow" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            {error}
          </div>
        ) : loading && !payments.length ? (
          <SkeletonTable />
        ) : payments.length === 0 ? (
          <EmptyState merchant={merchant} />
        ) : (
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
                          {formatAmount(p.grossAmount, t.decimals)}
                        </span>
                      </Td>
                      <Td right>
                        <span className="tabular text-emerald-400">
                          {formatAmount(p.netAmount, t.decimals)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-zinc-500">
                          {orderId || "—"}
                        </span>
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
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#0c0e11] p-6">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
      <div
        className={`mt-3 tabular text-2xl font-semibold tracking-tight truncate ${
          accent ? "text-[#5b8cff]" : "text-zinc-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500 ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={`px-4 py-3 ${right ? "text-right" : ""}`}>{children}</td>;
}

function SkeletonTable() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] bg-[#0a0c0f]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <div className="h-3 w-32 animate-pulse rounded bg-white/[0.04]" />
          <div className="ml-auto h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ merchant }: { merchant: `0x${string}` }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-14 text-center">
      <h3 className="text-[15px] font-medium tracking-tight text-zinc-100">No payments yet</h3>
      <p className="mt-1 text-[13px] text-zinc-500">
        Share a checkout link or embed the widget.
      </p>
      <a
        href={`/checkout?merchant=${merchant}&amount=10&token=USDC&orderId=TEST`}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block"
      >
        <Button>Test a payment</Button>
      </a>
    </div>
  );
}
