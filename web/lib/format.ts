import { formatUnits, toHex, keccak256, stringToBytes } from "viem";

export function shortAddr(addr?: string | null): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatAmount(raw: bigint, decimals: number, maxFrac = 6): string {
  const formatted = formatUnits(raw, decimals);
  const [whole, frac] = formatted.split(".");
  if (!frac) return groupThousands(whole);
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  return trimmed ? `${groupThousands(whole)}.${trimmed}` : groupThousands(whole);
}

function groupThousands(s: string): string {
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** UUID v4 ish, hex-encoded into bytes32 */
export function newPaymentId(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

/** Hash an arbitrary string into bytes32 (for metadata like orderId / SKU) */
export function hashMetadata(s: string): `0x${string}` {
  return keccak256(stringToBytes(s));
}

/** Encode short string (≤31 chars) into bytes32 directly (saves hash step) */
export function shortStringToBytes32(s: string): `0x${string}` {
  if (s.length > 31) return hashMetadata(s);
  const bytes = stringToBytes(s);
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return toHex(padded);
}

export function bytes32ToShortString(b32: string): string {
  try {
    const hex = b32.replace(/^0x/, "");
    const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const nonZero = bytes.findIndex((b, i, arr) => arr.slice(i).every((x) => x === 0));
    const trimmed = nonZero === -1 ? bytes : bytes.slice(0, nonZero);
    return new TextDecoder().decode(trimmed);
  } catch {
    return b32.slice(0, 10) + "…";
  }
}
