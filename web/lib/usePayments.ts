"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type PublicClient } from "viem";
import { PROCESSOR_ADDRESS } from "./contract";

export type PaymentLog = {
  txHash: `0x${string}`;
  blockNumber: bigint;
  merchant: `0x${string}`;
  payer: `0x${string}`;
  token: `0x${string}`;
  grossAmount: bigint;
  netAmount: bigint;
  fee: bigint;
  paymentId: `0x${string}`;
  metadata: `0x${string}`;
  timestamp?: number;
  refundedAmount?: bigint;
};

export type RefundLog = {
  txHash: `0x${string}`;
  blockNumber: bigint;
  merchant: `0x${string}`;
  customer: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  paymentId: `0x${string}`;
  timestamp?: number;
};

const PAYMENT_EVENT = parseAbiItem(
  "event Payment(address indexed merchant, address indexed payer, address indexed token, uint256 grossAmount, uint256 netAmount, uint256 fee, bytes32 paymentId, bytes32 metadata)",
);

const REFUND_EVENT = parseAbiItem(
  "event Refund(address indexed merchant, address indexed customer, address indexed token, uint256 amount, bytes32 paymentId)",
);

// Free-tier RPC caps eth_getLogs at 10k blocks. We chunk under that with safety margin.
const CHUNK_SIZE = 9_500n;
// Default lookback window. ~25h on Arc (sub-second blocks). Configurable later via "Load more".
const DEFAULT_LOOKBACK = 90_000n;

// Module-level block timestamp cache, shared across re-renders & hook instances.
const blockTsCache = new Map<string, number>();

async function batchBlockTimestamps(
  client: PublicClient,
  blockHashes: `0x${string}`[],
): Promise<Map<string, number>> {
  const unique = Array.from(new Set(blockHashes));
  const missing = unique.filter((h) => !blockTsCache.has(h));
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (h) => {
        try {
          const block = await client.getBlock({ blockHash: h });
          blockTsCache.set(h, Number(block.timestamp));
        } catch {}
      }),
    );
  }
  const out = new Map<string, number>();
  for (const h of unique) {
    const ts = blockTsCache.get(h);
    if (ts !== undefined) out.set(h, ts);
  }
  return out;
}

/**
 * Fetch event logs across an arbitrary block range by splitting into
 * RPC-safe chunks. Concurrency-limited to avoid rate caps.
 */
async function chunkedGetLogs<T>(
  client: PublicClient,
  fromBlock: bigint,
  toBlock: bigint,
  fetchOne: (from: bigint, to: bigint) => Promise<T[]>,
  concurrency = 4,
): Promise<T[]> {
  const ranges: Array<[bigint, bigint]> = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end = cursor + CHUNK_SIZE - 1n > toBlock ? toBlock : cursor + CHUNK_SIZE - 1n;
    ranges.push([cursor, end]);
    cursor = end + 1n;
  }

  const results: T[] = [];
  // Process N chunks at a time
  for (let i = 0; i < ranges.length; i += concurrency) {
    const batch = ranges.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(([f, t]) => fetchOne(f, t).catch((e) => {
        // Skip a chunk if it fails — partial data is better than no data
        console.warn(`chunk ${f}-${t} failed:`, (e as Error).message);
        return [] as T[];
      })),
    );
    for (const r of batchResults) results.push(...r);
  }
  return results;
}

export function usePayments(merchant?: `0x${string}`, refreshKey = 0) {
  const client = usePublicClient();
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [refunds, setRefunds] = useState<RefundLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [liveTick, setLiveTick] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const head = await client.getBlockNumber();
      const fromBlock = head > DEFAULT_LOOKBACK ? head - DEFAULT_LOOKBACK : 0n;

      const [paymentLogs, refundLogs] = await Promise.all([
        chunkedGetLogs(client, fromBlock, head, (from, to) =>
          client.getLogs({
            address: PROCESSOR_ADDRESS,
            event: PAYMENT_EVENT,
            args: merchant ? { merchant } : undefined,
            fromBlock: from,
            toBlock: to,
          }),
        ),
        chunkedGetLogs(client, fromBlock, head, (from, to) =>
          client.getLogs({
            address: PROCESSOR_ADDRESS,
            event: REFUND_EVENT,
            args: merchant ? { merchant } : undefined,
            fromBlock: from,
            toBlock: to,
          }),
        ),
      ]);

      const allHashes = [
        ...paymentLogs.map((l) => l.blockHash!),
        ...refundLogs.map((l) => l.blockHash!),
      ];
      const tsMap = await batchBlockTimestamps(client, allHashes);

      const paymentList: PaymentLog[] = paymentLogs.map((l) => ({
        txHash: l.transactionHash!,
        blockNumber: l.blockNumber!,
        merchant: l.args.merchant!,
        payer: l.args.payer!,
        token: l.args.token!,
        grossAmount: l.args.grossAmount!,
        netAmount: l.args.netAmount!,
        fee: l.args.fee!,
        paymentId: l.args.paymentId!,
        metadata: l.args.metadata!,
        timestamp: l.blockHash ? tsMap.get(l.blockHash) : undefined,
      }));

      const refundList: RefundLog[] = refundLogs.map((l) => ({
        txHash: l.transactionHash!,
        blockNumber: l.blockNumber!,
        merchant: l.args.merchant!,
        customer: l.args.customer!,
        token: l.args.token!,
        amount: l.args.amount!,
        paymentId: l.args.paymentId!,
        timestamp: l.blockHash ? tsMap.get(l.blockHash) : undefined,
      }));

      // Annotate payments with total refunded amount
      const refundsByPaymentId = new Map<string, bigint>();
      for (const r of refundList) {
        const cur = refundsByPaymentId.get(r.paymentId) ?? 0n;
        refundsByPaymentId.set(r.paymentId, cur + r.amount);
      }
      paymentList.forEach((p) => {
        const refunded = refundsByPaymentId.get(p.paymentId);
        if (refunded) p.refundedAmount = refunded;
      });

      paymentList.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      refundList.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setPayments(paymentList);
      setRefunds(refundList);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [client, merchant]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey, liveTick]);

  // Live watcher: re-fetch when a new Payment or Refund is emitted for this merchant.
  const unwatchPaymentRef = useRef<(() => void) | null>(null);
  const unwatchRefundRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!client || !merchant) return;
    try {
      unwatchPaymentRef.current = client.watchEvent({
        address: PROCESSOR_ADDRESS,
        event: PAYMENT_EVENT,
        args: { merchant },
        onLogs: () => setLiveTick((t) => t + 1),
      });
      unwatchRefundRef.current = client.watchEvent({
        address: PROCESSOR_ADDRESS,
        event: REFUND_EVENT,
        args: { merchant },
        onLogs: () => setLiveTick((t) => t + 1),
      });
    } catch {
      // RPC may not support filters — degrade gracefully
    }
    return () => {
      unwatchPaymentRef.current?.();
      unwatchRefundRef.current?.();
    };
  }, [client, merchant]);

  return useMemo(
    () => ({ payments, refunds, loading, error, refetch: fetchAll }),
    [payments, refunds, loading, error, fetchAll],
  );
}
