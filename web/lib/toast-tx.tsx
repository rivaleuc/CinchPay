import { toast } from "sonner";
import { EXPLORER } from "./contract";

type TxToastOptions = {
  id?: string | number;
  description?: string;
};

export function toastTxPending(message: string, hash: `0x${string}`, opts?: TxToastOptions) {
  return toast.loading(message, {
    id: opts?.id,
    description: (
      <a
        href={`${EXPLORER}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-[11px] underline-offset-2 hover:underline"
      >
        {hash.slice(0, 10)}…{hash.slice(-6)}
      </a>
    ),
  });
}

export function toastTxSuccess(message: string, hash: `0x${string}`, opts?: TxToastOptions) {
  return toast.success(message, {
    id: opts?.id,
    description: (
      <a
        href={`${EXPLORER}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-[11px] underline-offset-2 hover:underline"
      >
        {hash.slice(0, 10)}…{hash.slice(-6)} →
      </a>
    ),
    duration: 6000,
  });
}

export function toastTxError(message: string, err: unknown, opts?: TxToastOptions) {
  const e = err as { shortMessage?: string; message?: string };
  let desc = e?.shortMessage || e?.message || "Unknown error";
  // strip noisy wagmi stack traces
  if (desc.length > 140) desc = desc.slice(0, 140) + "…";
  return toast.error(message, {
    id: opts?.id,
    description: desc,
  });
}
