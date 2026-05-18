/**
 * CinchPay SDK — shared types
 */

export type TokenSymbol = "USDC" | "EURC";

export interface PaymentOptions {
  /** Merchant wallet address that receives the funds (0x...). */
  merchant: string;
  /** Decimal amount as a string or number (e.g. "29.99" or 29.99). */
  amount: string | number;
  /** Token to pay in. Defaults to "USDC". */
  token?: TokenSymbol;
  /** Your internal order id — echoed back in onSuccess. */
  orderId?: string;
  /** 32-byte hex payment id. Auto-generated if omitted. */
  paymentId?: `0x${string}`;
  /** Where to redirect after success (full-page flow only). */
  returnUrl?: string;
  /** Where to redirect on cancel (full-page flow only). */
  cancelUrl?: string;
  /** Fires when the iframe has loaded. */
  onReady?: (payload: ReadyPayload) => void;
  /** Fires when the on-chain payment is confirmed. */
  onSuccess?: (payload: SuccessPayload) => void;
  /** Fires when the customer dismisses the checkout. */
  onClose?: (payload: ClosePayload) => void;
}

export interface ReadyPayload {
  paymentId: `0x${string}`;
}

export interface SuccessPayload {
  txHash: `0x${string}`;
  paymentId: `0x${string}`;
  merchant: string;
  amount: string;
  currency: TokenSymbol;
  orderId?: string;
}

export interface ClosePayload {
  paymentId: `0x${string}`;
}

export interface OpenHandle {
  /** Programmatically close the current checkout. */
  close: () => void;
  /** The payment id used by the current checkout. */
  paymentId: `0x${string}`;
}

export interface CinchPayConfig {
  /** Override the origin used for the checkout iframe. Defaults to https://cinchpay.app. */
  origin?: string;
}
