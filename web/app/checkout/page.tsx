"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAddress, parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { AlertCircle, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ERC20_ABI,
  EXPLORER,
  PROCESSOR_ABI,
  PROCESSOR_ADDRESS,
  TOKENS,
  type TokenKey,
} from "@/lib/contract";
import { formatAmount, newPaymentId, shortAddr, shortStringToBytes32 } from "@/lib/format";
import { toastTxPending, toastTxSuccess, toastTxError } from "@/lib/toast-tx";
import { Button, Logo } from "@/components/cinch/primitives";

type Status = "idle" | "approving" | "paying" | "confirming" | "success" | "error";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const params = useSearchParams();
  // Support both naming schemes: merchant/amount/token and to/amount/currency
  const merchant = (params.get("merchant") || params.get("to")) as `0x${string}` | null;
  const amountStr = params.get("amount") || "";
  const tokenParam = (params.get("token") || params.get("currency") || "USDC").toUpperCase() as TokenKey;
  const orderId = params.get("orderId") || params.get("order") || "";
  const presetPaymentId = params.get("paymentId") as `0x${string}` | null;
  const returnUrl = params.get("returnUrl") || params.get("return_url");
  const cancelUrl = params.get("cancelUrl") || params.get("cancel_url");

  const token = TOKENS[tokenParam] || TOKENS.USDC;
  const paymentId = useMemo<`0x${string}`>(
    () => presetPaymentId || newPaymentId(),
    [presetPaymentId],
  );
  const metadataBytes = useMemo<`0x${string}`>(
    () => (orderId ? shortStringToBytes32(orderId) : ("0x" + "0".repeat(64)) as `0x${string}`),
    [orderId],
  );

  const validMerchant = merchant && isAddress(merchant);
  let amountWei = 0n;
  try {
    amountWei = amountStr ? parseUnits(amountStr, token.decimals) : 0n;
  } catch {}
  const validAmount = amountWei > 0n;
  const valid = validMerchant && validAmount;

  const { address, isConnected } = useAccount();
  const { data: balance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, PROCESSOR_ADDRESS] : undefined,
    query: { enabled: !!address },
  });
  const { data: feeBps } = useReadContract({
    address: PROCESSOR_ADDRESS,
    abi: PROCESSOR_ABI,
    functionName: "feeBps",
  });
  const { data: alreadyConsumed } = useReadContract({
    address: PROCESSOR_ADDRESS,
    abi: PROCESSOR_ABI,
    functionName: "consumed",
    args: [paymentId],
  });

  const fee = feeBps !== undefined ? (amountWei * BigInt(feeBps)) / 10000n : 0n;
  const net = amountWei - fee;
  const needApproval = allowance !== undefined && allowance < amountWei;
  const insufficient = balance !== undefined && amountWei > 0n && balance < amountWei;

  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string>("");

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: status === "approving" ? txHash : undefined,
  });
  const { isSuccess: isPayConfirmed } = useWaitForTransactionReceipt({
    hash: status === "confirming" ? txHash : undefined,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "cinchpay:ready", payload: { paymentId } }, "*");
    }
  }, [paymentId]);

  useEffect(() => {
    if (status === "approving" && isApproveConfirmed && txHash) {
      refetchAllowance();
      setStatus("idle");
      toastTxSuccess(`${token.symbol} approved`, txHash, { id: "tx-approve" });
      setTxHash(undefined);
    }
  }, [isApproveConfirmed, status, refetchAllowance, txHash, token.symbol]);

  useEffect(() => {
    if (status === "confirming" && isPayConfirmed && txHash) {
      setStatus("success");
      toastTxSuccess("Payment confirmed", txHash, { id: "tx-pay" });
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "cinchpay:success",
            payload: { txHash, orderId, amount: amountStr, currency: token.symbol, paymentId, merchant },
          },
          "*",
        );
      }
      if (returnUrl) {
        const sep = returnUrl.includes("?") ? "&" : "?";
        const url = `${returnUrl}${sep}order=${orderId}&tx=${txHash}&status=success`;
        setTimeout(() => { window.location.href = url; }, 1500);
      }
    }
  }, [isPayConfirmed, status, txHash, paymentId, merchant, amountStr, token.symbol, orderId, returnUrl]);

  async function handleApprove() {
    setError("");
    setStatus("approving");
    toast.loading("Confirm approval in your wallet…", { id: "tx-approve" });
    try {
      const h = await writeContractAsync({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PROCESSOR_ADDRESS, amountWei],
      });
      setTxHash(h);
      toastTxPending("Approval submitted", h, { id: "tx-approve" });
    } catch (e: unknown) {
      setStatus("error");
      const err = e as { shortMessage?: string; message?: string };
      setError(err?.shortMessage || err?.message || "Approval failed");
      toastTxError("Approval failed", e, { id: "tx-approve" });
    }
  }

  async function handlePay() {
    if (!merchant) return;
    setError("");
    setStatus("paying");
    toast.loading("Confirm payment in your wallet…", { id: "tx-pay" });
    try {
      const h = await writeContractAsync({
        address: PROCESSOR_ADDRESS,
        abi: PROCESSOR_ABI,
        functionName: "pay",
        args: [merchant, token.address, amountWei, paymentId, metadataBytes],
      });
      setTxHash(h);
      setStatus("confirming");
      toastTxPending("Settling onchain…", h, { id: "tx-pay" });
    } catch (e: unknown) {
      setStatus("error");
      const err = e as { shortMessage?: string; message?: string };
      setError(err?.shortMessage || err?.message || "Payment failed");
      toastTxError("Payment failed", e, { id: "tx-pay" });
    }
  }

  function handleCancel() {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "cinchpay:close", payload: { paymentId } }, "*");
    }
    if (cancelUrl) window.location.href = cancelUrl;
  }

  if (!valid) return <Invalid merchant={merchant} amountStr={amountStr} />;

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080a] px-4">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center pb-6">
            <Logo />
          </div>
          <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0c0e11] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
              <Check className="h-6 w-6 text-emerald-400" strokeWidth={2.5} />
            </div>
            <h2 className="mt-6 text-xl font-medium tracking-tight text-zinc-100">
              Payment confirmed
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Settled on Arc Testnet.
            </p>
            {txHash && (
              <a
                href={`${EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                {txHash.slice(0, 10)}…{txHash.slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-600">
            Powered by CinchPay · Atomic onchain settlement
          </p>
        </div>
      </div>
    );
  }

  const stepNum = needApproval ? 1 : 2;
  const ctaLabel =
    !isConnected
      ? "Connect wallet"
      : status === "approving"
        ? "Approving…"
        : status === "paying"
          ? "Confirm in wallet…"
          : status === "confirming"
            ? "Confirming…"
            : needApproval
              ? `Approve ${token.symbol}`
              : `Pay ${amountStr} ${token.symbol}`;
  const ctaBusy = status === "approving" || status === "paying" || status === "confirming";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080a] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center pb-6">
          <Logo />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0e11]">
          {/* Total */}
          <div className="px-6 pt-8 pb-7 text-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              Total
            </span>
            <div className="mt-3 flex items-baseline justify-center gap-1.5">
              <span className="tabular text-4xl font-semibold tracking-tight text-zinc-50">
                {amountStr}
              </span>
              <span className="text-sm font-medium text-zinc-500">{token.symbol}</span>
            </div>
            {orderId && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-zinc-500">
                {orderId}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="border-t border-white/[0.06] px-6">
            <DetailRow k="Pay to" v={shortAddr(merchant!)} mono />
            <DetailRow k="Network" v="Arc Testnet" />
            <DetailRow
              k="Processor fee"
              v={feeBps !== undefined ? `${(Number(feeBps) / 100).toFixed(2)}% · ${formatAmount(fee, token.decimals)} ${token.symbol}` : "—"}
              muted
            />
            <DetailRow
              k="Merchant receives"
              v={`${formatAmount(net, token.decimals)} ${token.symbol}`}
              bold
            />
          </div>

          {/* Action */}
          <div className="border-t border-white/[0.06] bg-[#0a0b0e] px-6 py-6">
            {alreadyConsumed && (
              <Notice tone="warn">This payment ID was already used.</Notice>
            )}
            {insufficient && (
              <Notice tone="error">
                Insufficient {token.symbol}. Have{" "}
                <span className="tabular">
                  {balance !== undefined ? formatAmount(balance, token.decimals) : "0"}
                </span>
                .
              </Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}

            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button onClick={openConnectModal} className="w-full rounded-xl py-3 text-[15px]">
                    Connect wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            ) : (
              <Button
                onClick={needApproval ? handleApprove : handlePay}
                disabled={!!alreadyConsumed || !!insufficient || ctaBusy}
                className="w-full rounded-xl py-3 text-[15px]"
              >
                {ctaBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {ctaLabel}
              </Button>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                {isConnected ? `Step ${stepNum} of 2` : "Connect to continue"}
              </span>
              <button
                onClick={handleCancel}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel checkout
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Powered by CinchPay · Atomic onchain settlement
        </p>
      </div>
    </div>
  );
}

function DetailRow({
  k,
  v,
  mono,
  muted,
  bold,
}: {
  k: string;
  v: string;
  mono?: boolean;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-3 last:border-b-0">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{k}</span>
      <span
        className={`tabular text-sm ${mono ? "font-mono" : ""} ${
          muted ? "text-zinc-600" : bold ? "font-medium text-zinc-100" : "text-zinc-300"
        }`}
      >
        {v}
      </span>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "error"; children: React.ReactNode }) {
  const styles =
    tone === "warn"
      ? "border-amber-500/20 bg-amber-500/[0.05] text-amber-300"
      : "border-red-500/20 bg-red-500/[0.05] text-red-300";
  return (
    <div className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${styles}`}>
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Invalid({ merchant, amountStr }: { merchant: string | null; amountStr: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080a] px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center pb-6">
          <Logo />
        </div>
        <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-[#0c0e11] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/5">
            <AlertCircle className="h-6 w-6 text-red-400" strokeWidth={2} />
          </div>
          <h2 className="mt-6 text-xl font-medium tracking-tight text-zinc-100">
            Invalid checkout link
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {!merchant || !isAddress(merchant)
              ? "Missing or invalid merchant address."
              : !amountStr
                ? "Missing amount."
                : "Check your query parameters."}
          </p>
          <p className="mt-4 text-[11px] text-zinc-600">
            Required: <code className="text-zinc-400">merchant</code>, <code className="text-zinc-400">amount</code>
          </p>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080a] px-4">
      <div className="h-[500px] w-full max-w-[420px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
    </div>
  );
}
