/**
 * CinchPay SDK — React entry
 *
 * @example
 * import { CinchPayButton } from "@cinchpay/sdk/react";
 *
 * <CinchPayButton
 *   merchant="0x..."
 *   amount={29.99}
 *   onSuccess={({ txHash }) => console.log(txHash)}
 * >
 *   Pay 29.99 USDC
 * </CinchPayButton>
 */
import * as React from "react";
import type { PaymentOptions, SuccessPayload, ClosePayload, ReadyPayload } from "./types.js";
export type { PaymentOptions, SuccessPayload, ClosePayload, ReadyPayload, } from "./types.js";
export interface CinchPayButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
    merchant: string;
    amount: string | number;
    token?: PaymentOptions["token"];
    orderId?: string;
    paymentId?: PaymentOptions["paymentId"];
    returnUrl?: string;
    cancelUrl?: string;
    onSuccess?: (payload: SuccessPayload) => void;
    onClose?: (payload: ClosePayload) => void;
    onReady?: (payload: ReadyPayload) => void;
    children?: React.ReactNode;
}
/**
 * A drop-in `<button>` that opens the CinchPay checkout modal on click.
 * Forwards all standard button attrs (className, style, disabled, etc.).
 */
export declare const CinchPayButton: React.ForwardRefExoticComponent<CinchPayButtonProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * Hook version — returns an imperative `open(overrides?)` function plus a `close()`.
 */
export declare function useCinchPay(defaults?: Omit<PaymentOptions, "merchant" | "amount"> & {
    merchant?: string;
    amount?: string | number;
}): {
    open: (overrides?: Partial<PaymentOptions>) => import("./types.js").OpenHandle;
};
//# sourceMappingURL=react.d.ts.map