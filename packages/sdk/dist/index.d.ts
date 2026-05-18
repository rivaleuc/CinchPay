/**
 * CinchPay SDK — vanilla TypeScript / browser
 *
 * @example
 * import { CinchPay } from "@cinchpay/sdk";
 *
 * CinchPay.open({
 *   merchant: "0x...",
 *   amount: 29.99,
 *   token: "USDC",
 *   orderId: "ORD-001",
 *   onSuccess: ({ txHash, paymentId }) => fulfill(paymentId, txHash),
 * });
 */
import type { CinchPayConfig, OpenHandle, PaymentOptions } from "./types.js";
export type { CinchPayConfig, ClosePayload, OpenHandle, PaymentOptions, ReadyPayload, SuccessPayload, TokenSymbol, } from "./types.js";
/** Configure the SDK (e.g. override origin for self-hosted deployments). */
export declare function configure(config: CinchPayConfig): void;
/**
 * Open the CinchPay checkout in a modal iframe.
 * Returns a handle with .close() and the assigned paymentId.
 */
export declare function open(opts: PaymentOptions): OpenHandle;
/** Close the currently open CinchPay modal, if any. */
export declare function close(): void;
/** Generate a fresh 32-byte payment id. Useful for pre-creating ids server-side. */
export declare function newPaymentId(): `0x${string}`;
/**
 * Default export with the namespaced API.
 * @example
 * import CinchPay from "@cinchpay/sdk";
 * CinchPay.open({ ... });
 */
export declare const CinchPay: {
    readonly open: typeof open;
    readonly close: typeof close;
    readonly configure: typeof configure;
    readonly newPaymentId: typeof newPaymentId;
    readonly version: "0.1.0";
};
export default CinchPay;
//# sourceMappingURL=index.d.ts.map