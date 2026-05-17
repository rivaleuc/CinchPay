"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
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
};

const PAYMENT_EVENT = parseAbiItem(
  "event Payment(address indexed merchant, address indexed payer, address indexed token, uint256 grossAmount, uint256 netAmount, uint256 fee, bytes32 paymentId, bytes32 metadata)",
);

export function usePayments(merchant?: `0x${string}`, refreshKey = 0) {
  const client = usePublicClient();
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // Limit to a reasonable range to avoid heavy RPC calls.
        // 50,000 blocks at ~1s/block = ~14 hours of history.
        const head = await client.getBlockNumber();
        const fromBlock = head > 200_000n ? head - 200_000n : 0n;

        const logs = await client.getLogs({
          address: PROCESSOR_ADDRESS,
          event: PAYMENT_EVENT,
          args: merchant ? { merchant } : undefined,
          fromBlock,
          toBlock: "latest",
        });

        const enriched = await Promise.all(
          logs.map(async (l) => {
            let timestamp: number | undefined;
            try {
              const block = await client.getBlock({ blockHash: l.blockHash! });
              timestamp = Number(block.timestamp);
            } catch {}
            return {
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
              timestamp,
            } as PaymentLog;
          }),
        );

        if (!cancelled) {
          // newest first
          enriched.sort((a, b) => Number(b.blockNumber - a.blockNumber));
          setPayments(enriched);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load payments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, merchant, refreshKey]);

  return { payments, loading, error };
}
