"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import {
  ERC20_ABI,
  EXPLORER,
  PROCESSOR_ABI,
  PROCESSOR_ADDRESS,
} from "@/lib/contract";
import { formatAmount, shortAddr } from "@/lib/format";
import { toastTxPending, toastTxSuccess, toastTxError } from "@/lib/toast-tx";
import { Button } from "@/components/cinch/primitives";
import { toast } from "sonner";

export type RefundTarget = {
  paymentId: `0x${string}`;
  customer: `0x${string}`;
  token: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  originalAmount: bigint;
};

type Stage = "form" | "approving" | "refunding" | "success";

export function RefundModal({
  merchant,
  target,
  onClose,
  onSuccess,
}: {
  merchant: `0x${string}`;
  target: RefundTarget;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const maxStr = formatAmount(target.originalAmount, target.tokenDecimals);
  const [amount, setAmount] = useState(maxStr);
  const [stage, setStage] = useState<Stage>("form");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  let amountWei = 0n;
  try {
    amountWei = amount ? parseUnits(amount, target.tokenDecimals) : 0n;
  } catch {}

  const exceedsOriginal = amountWei > target.originalAmount;
  const validAmount = amountWei > 0n && !exceedsOriginal;

  const { data: balance } = useReadContract({
    address: target.token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [merchant],
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: target.token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [merchant, PROCESSOR_ADDRESS],
  });

  const insufficient = balance !== undefined && amountWei > balance;
  const needApproval = allowance !== undefined && allowance < amountWei;

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: stage === "approving" ? txHash : undefined,
  });
  const { isSuccess: isRefundConfirmed } = useWaitForTransactionReceipt({
    hash: stage === "refunding" ? txHash : undefined,
  });

  useEffect(() => {
    if (stage === "approving" && isApproveConfirmed && txHash) {
      refetchAllowance();
      toastTxSuccess(`${target.tokenSymbol} approved`, txHash, { id: "rf-approve" });
      setStage("form");
      setTxHash(undefined);
    }
  }, [stage, isApproveConfirmed, txHash, refetchAllowance, target.tokenSymbol]);

  useEffect(() => {
    if (stage === "refunding" && isRefundConfirmed && txHash) {
      toastTxSuccess("Refund settled", txHash, { id: "rf-refund" });
      setStage("success");
      onSuccess?.();
    }
  }, [stage, isRefundConfirmed, txHash, onSuccess]);

  async function approve() {
    setStage("approving");
    toast.loading("Confirm approval in your wallet…", { id: "rf-approve" });
    try {
      const h = await writeContractAsync({
        address: target.token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PROCESSOR_ADDRESS, amountWei],
      });
      setTxHash(h);
      toastTxPending("Approval submitted", h, { id: "rf-approve" });
    } catch (e: unknown) {
      setStage("form");
      toastTxError("Approval failed", e, { id: "rf-approve" });
    }
  }

  async function refund() {
    setStage("refunding");
    toast.loading("Confirm refund in your wallet…", { id: "rf-refund" });
    try {
      const h = await writeContractAsync({
        address: PROCESSOR_ADDRESS,
        abi: PROCESSOR_ABI,
        functionName: "refund",
        args: [target.customer, target.token, amountWei, target.paymentId],
      });
      setTxHash(h);
      toastTxPending("Refunding…", h, { id: "rf-refund" });
    } catch (e: unknown) {
      setStage("form");
      toastTxError("Refund failed", e, { id: "rf-refund" });
    }
  }

  const busy = stage === "approving" || stage === "refunding";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/40 backdrop-blur-sm px-4 fade-in">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
              Refund
            </div>
            <div className="font-bold tracking-tight text-[15px] mt-0.5">
              Payment {target.paymentId.slice(0, 10)}…
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {stage === "success" ? (
          <SuccessView txHash={txHash} amount={amount} symbol={target.tokenSymbol} customer={target.customer} onClose={onClose} />
        ) : (
          <div className="p-5 space-y-5">
            {/* Customer */}
            <Row label="Customer">
              <span className="font-mono text-sm">{shortAddr(target.customer)}</span>
            </Row>

            {/* Original */}
            <Row label="Original payment">
              <span className="font-mono tabular text-sm">
                {maxStr} {target.tokenSymbol}
              </span>
            </Row>

            {/* Refund amount input */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold block mb-2">
                Refund amount
              </label>
              <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 focus-within:border-[var(--border-strong)] transition-colors">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base font-semibold tabular text-[var(--fg)]"
                  placeholder="0.00"
                />
                <span className="text-[11px] text-[var(--fg-muted)] font-semibold">
                  {target.tokenSymbol}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(maxStr)}
                  className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline font-bold"
                >
                  Max
                </button>
              </div>
              {exceedsOriginal && (
                <p className="mt-2 text-[11px] text-red-700">
                  Cannot exceed the original payment of {maxStr} {target.tokenSymbol}.
                </p>
              )}
              {insufficient && (
                <p className="mt-2 text-[11px] text-red-700">
                  Insufficient {target.tokenSymbol} balance. Have{" "}
                  <span className="tabular font-mono">
                    {balance !== undefined ? formatAmount(balance, target.tokenDecimals) : "0"}
                  </span>
                </p>
              )}
            </div>

            {/* Hint */}
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
              The refund pulls {target.tokenSymbol} from your wallet and sends it back to the customer.
              You can refund partial or full amounts. Multiple refunds per payment are allowed.
            </p>

            {/* Actions */}
            <div className="space-y-2">
              {needApproval ? (
                <Button
                  variant="accent"
                  onClick={approve}
                  disabled={busy || !validAmount || insufficient}
                  className="w-full"
                >
                  {stage === "approving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving…
                    </>
                  ) : (
                    <>Approve {target.tokenSymbol}</>
                  )}
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={refund}
                  disabled={busy || !validAmount || insufficient}
                  className="w-full"
                >
                  {stage === "refunding" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refunding…
                    </>
                  ) : (
                    <>Refund {amount || "0"} {target.tokenSymbol}</>
                  )}
                </Button>
              )}
              <button
                onClick={onClose}
                disabled={busy}
                className="w-full rounded-md py-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">
        {label}
      </span>
      {children}
    </div>
  );
}

function SuccessView({
  txHash,
  amount,
  symbol,
  customer,
  onClose,
}: {
  txHash?: `0x${string}`;
  amount: string;
  symbol: string;
  customer: `0x${string}`;
  onClose: () => void;
}) {
  return (
    <div className="p-8 text-center fade-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)]">
        <Check className="h-6 w-6 text-[var(--accent)]" strokeWidth={2.5} />
      </div>
      <h3 className="mt-5 display text-2xl">Refund sent</h3>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        <span className="tabular font-mono">{amount} {symbol}</span> returned to{" "}
        <span className="font-mono">{shortAddr(customer)}</span>.
      </p>
      {txHash && (
        <a
          href={`${EXPLORER}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          {shortAddr(txHash)}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      <Button onClick={onClose} className="mt-6 w-full">
        Close
      </Button>
    </div>
  );
}
