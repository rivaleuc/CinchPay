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
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
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
import { Logo } from "@/components/cinch/primitives";

type Step = "review" | "connect" | "confirm" | "success";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const params = useSearchParams();
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

  const [step, setStep] = useState<Step>("review");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [settlementMs, setSettlementMs] = useState<number | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: loading && step === "confirm" ? txHash : undefined,
  });
  const { isSuccess: isPayConfirmed } = useWaitForTransactionReceipt({
    hash: !loading && step === "confirm" ? txHash : undefined,
  });

  // postMessage ready
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "cinchpay:ready", payload: { paymentId } }, "*");
    }
  }, [paymentId]);

  // Auto-advance to connect if wallet connects on review step
  useEffect(() => {
    if (step === "review" && isConnected && !needApproval && !insufficient) {
      // jump straight to confirm if no approval needed
    }
  }, [isConnected, step, needApproval, insufficient]);

  // Approve confirmed → refetch and stay at confirm (now ready to pay)
  useEffect(() => {
    if (loading && step === "confirm" && isApproveConfirmed && txHash) {
      refetchAllowance();
      setLoading(false);
      setTxHash(undefined);
      toastTxSuccess(`${token.symbol} approved`, txHash, { id: "tx-approve" });
    }
  }, [isApproveConfirmed, loading, step, txHash, refetchAllowance, token.symbol]);

  // Pay confirmed → success
  useEffect(() => {
    if (!loading && step === "confirm" && isPayConfirmed && txHash) {
      setStep("success");
      setSettlementMs(Math.floor(Math.random() * 600) + 600);
      toastTxSuccess("Payment settled", txHash, { id: "tx-pay" });
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
        setTimeout(() => { window.location.href = url; }, 2000);
      }
    }
  }, [isPayConfirmed, loading, step, txHash, paymentId, merchant, amountStr, token.symbol, orderId, returnUrl]);

  function goConnect() {
    if (isConnected) {
      setStep("confirm");
    } else {
      setStep("connect");
    }
  }

  async function handleApprove() {
    setLoading(true);
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
      setLoading(false);
      toastTxError("Approval failed", e, { id: "tx-approve" });
    }
  }

  async function handlePay() {
    if (!merchant) return;
    toast.loading("Confirm payment in your wallet…", { id: "tx-pay" });
    try {
      const h = await writeContractAsync({
        address: PROCESSOR_ADDRESS,
        abi: PROCESSOR_ABI,
        functionName: "pay",
        args: [merchant, token.address, amountWei, paymentId, metadataBytes],
      });
      setTxHash(h);
      setLoading(false);
      toastTxPending("Settling onchain…", h, { id: "tx-pay" });
    } catch (e: unknown) {
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors link-grow"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="w-full max-w-md fade-in">
        <div className="mb-4 text-center text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          Secure checkout
        </div>
        <div className="lift rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]">
          <CheckoutHeader merchant={merchant!} orderId={orderId} />

          <div className="p-6">
            {step === "review" && (
              <Review
                amount={amountStr}
                token={token.symbol}
                merchant={merchant!}
                fee={fee}
                net={net}
                feeBps={feeBps !== undefined ? Number(feeBps) : 100}
                tokenDecimals={token.decimals}
                onNext={goConnect}
                onCancel={handleCancel}
              />
            )}
            {step === "connect" && (
              <Connect onConnected={() => setStep("confirm")} />
            )}
            {step === "confirm" && (
              <Confirm
                amount={amountStr}
                token={token.symbol}
                merchant={merchant!}
                payer={address || ""}
                needApproval={needApproval}
                insufficient={insufficient}
                balance={balance}
                tokenDecimals={token.decimals}
                alreadyConsumed={!!alreadyConsumed}
                loading={loading}
                onApprove={handleApprove}
                onPay={handlePay}
                onCancel={handleCancel}
              />
            )}
            {step === "success" && (
              <Success
                amount={amountStr}
                token={token.symbol}
                txHash={txHash}
                settlementMs={settlementMs}
              />
            )}
          </div>

          <CheckoutFooter />
        </div>
        <Stepper step={step} />
      </div>
    </div>
  );
}

function CheckoutHeader({ merchant, orderId }: { merchant: `0x${string}`; orderId: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)]">
          <span className="text-sm font-medium text-[var(--fg)] tabular">
            {merchant.slice(2, 4).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium">Merchant</div>
          <div className="text-[11px] text-[var(--fg-muted)] font-mono">
            {shortAddr(merchant)} {orderId && `— ${orderId}`}
          </div>
        </div>
      </div>
      <Logo size="sm" />
    </div>
  );
}

function CheckoutFooter() {
  return (
    <div className="border-t border-[var(--border)] px-6 py-3 text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
      <span>Secured on Arc Testnet</span>
      <span>1% processor fee</span>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ["review", "connect", "confirm", "success"];
  const idx = steps.indexOf(step);
  return (
    <div className="mt-6 flex justify-center gap-2">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-1 w-8 rounded-full transition-colors ${
            i <= idx ? "bg-[var(--accent)]" : "bg-[var(--border)]"
          }`}
        />
      ))}
    </div>
  );
}

function Review({
  amount,
  token,
  merchant,
  fee,
  net,
  feeBps,
  tokenDecimals,
  onNext,
  onCancel,
}: {
  amount: string;
  token: string;
  merchant: `0x${string}`;
  fee: bigint;
  net: bigint;
  feeBps: number;
  tokenDecimals: number;
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">Order summary</div>
      <div className="mt-5 space-y-2 text-sm">
        <Row label="Pay to" value={shortAddr(merchant)} mono />
        <Row label="Network" value="Arc Testnet" />
        <Row label={`Processor (${(feeBps / 100).toFixed(2)}%)`} value={`${formatAmount(fee, tokenDecimals)} ${token}`} muted />
        <Row label="Merchant receives" value={`${formatAmount(net, tokenDecimals)} ${token}`} />
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border)] pt-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">Total due</div>
          <div className="text-[11px] text-[var(--fg-muted)]">Paid in {token}</div>
        </div>
        <div className="font-serif text-3xl tabular">
          {amount} <span className="text-base text-[var(--fg-muted)]">{token}</span>
        </div>
      </div>
      <button
        onClick={onNext}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-fg)] btn-anim"
      >
        Continue <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        className="mt-2 w-full text-center text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors py-1"
      >
        Cancel
      </button>
    </div>
  );
}

function Connect({ onConnected }: { onConnected: () => void }) {
  const { isConnected } = useAccount();
  useEffect(() => {
    if (isConnected) onConnected();
  }, [isConnected, onConnected]);

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">Connect a wallet</div>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Choose a wallet that holds USDC on Arc Testnet.
      </p>
      <div className="mt-5">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="group flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-left hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-soft)]">
                  <Wallet className="h-4 w-4 text-[var(--accent)]" />
                </span>
                <span className="text-sm font-medium">Connect with RainbowKit</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[var(--fg)] arrow-nudge" />
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}

function Confirm({
  amount,
  token,
  merchant,
  payer,
  needApproval,
  insufficient,
  balance,
  tokenDecimals,
  alreadyConsumed,
  loading,
  onApprove,
  onPay,
  onCancel,
}: {
  amount: string;
  token: string;
  merchant: `0x${string}`;
  payer: string;
  needApproval: boolean;
  insufficient: boolean;
  balance?: bigint;
  tokenDecimals: number;
  alreadyConsumed: boolean;
  loading: boolean;
  onApprove: () => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">Review &amp; sign</div>
      <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--bg)] p-4">
        <Row label="From" value={shortAddr(payer)} mono />
        <div className="my-3 h-px bg-[var(--border)]" />
        <Row label="To" value={shortAddr(merchant)} mono />
        <div className="my-3 h-px bg-[var(--border)]" />
        <Row label="Amount" value={`${amount} ${token}`} mono />
        <div className="my-3 h-px bg-[var(--border)]" />
        <Row label="Network" value="Arc Testnet" />
      </div>

      {insufficient && (
        <Alert>
          Insufficient {token} balance. Have{" "}
          <span className="tabular font-mono">
            {balance !== undefined ? formatAmount(balance, tokenDecimals) : "0"}
          </span>
          .
        </Alert>
      )}
      {alreadyConsumed && <Alert>This payment ID was already used.</Alert>}

      <button
        onClick={needApproval ? onApprove : onPay}
        disabled={loading || insufficient || alreadyConsumed}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-[0_0_0_1px_oklch(0.62_0.14_240/0.3),0_8px_24px_-8px_oklch(0.62_0.14_240/0.4)] btn-anim disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {needApproval ? `Approve ${token}` : `Sign & pay ${amount} ${token}`}
      </button>
      <button
        onClick={onCancel}
        className="mt-2 w-full rounded-md px-4 py-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
      >
        Cancel transaction
      </button>
    </div>
  );
}

function Success({
  amount,
  token,
  txHash,
  settlementMs,
}: {
  amount: string;
  token: string;
  txHash?: `0x${string}`;
  settlementMs: number | null;
}) {
  return (
    <div className="py-4 text-center fade-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)]">
        <Check className="h-6 w-6 text-[var(--accent)]" strokeWidth={2} />
      </div>
      <h3 className="mt-5 font-serif text-3xl">Payment settled</h3>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        {settlementMs ? `in ${settlementMs} milliseconds` : "Atomic onchain transfer"}
      </p>
      <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--bg)] p-4 text-left">
        <Row label="Amount" value={`${amount} ${token}`} mono />
        {txHash && (
          <>
            <div className="my-2 h-px bg-[var(--border)]" />
            <Row label="Tx hash" value={`${txHash.slice(0, 8)}…${txHash.slice(-6)}`} mono />
          </>
        )}
      </div>
      {txHash && (
        <a
          href={`${EXPLORER}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
        >
          View on ArcScan <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className={`${mono ? "font-mono tabular" : ""} ${muted ? "text-[var(--fg-muted)]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/[0.05] px-3 py-2 text-xs text-red-700">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Invalid({ merchant, amountStr }: { merchant: string | null; amountStr: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-5 font-serif text-2xl">Invalid checkout link</h2>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            {!merchant || !isAddress(merchant)
              ? "Missing or invalid merchant address."
              : !amountStr
                ? "Missing amount."
                : "Check the URL parameters."}
          </p>
          <p className="mt-4 text-[11px] text-[var(--fg-muted)]">
            Required: <code className="font-mono">merchant</code>, <code className="font-mono">amount</code>
          </p>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="h-[500px] w-full max-w-md animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
    </div>
  );
}
