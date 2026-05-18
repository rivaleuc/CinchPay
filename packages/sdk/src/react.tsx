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
import { open as openCheckout } from "./index.js";
import type {
  PaymentOptions,
  SuccessPayload,
  ClosePayload,
  ReadyPayload,
} from "./types.js";

export type {
  PaymentOptions,
  SuccessPayload,
  ClosePayload,
  ReadyPayload,
} from "./types.js";

export interface CinchPayButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
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
export const CinchPayButton = React.forwardRef<
  HTMLButtonElement,
  CinchPayButtonProps
>(function CinchPayButton(
  {
    merchant,
    amount,
    token,
    orderId,
    paymentId,
    returnUrl,
    cancelUrl,
    onSuccess,
    onClose,
    onReady,
    children,
    ...rest
  },
  ref,
) {
  const handle = React.useCallback(() => {
    openCheckout({
      merchant,
      amount,
      token,
      orderId,
      paymentId,
      returnUrl,
      cancelUrl,
      onSuccess,
      onClose,
      onReady,
    });
  }, [
    merchant,
    amount,
    token,
    orderId,
    paymentId,
    returnUrl,
    cancelUrl,
    onSuccess,
    onClose,
    onReady,
  ]);

  return (
    <button ref={ref} type="button" onClick={handle} {...rest}>
      {children ?? `Pay ${amount} ${token ?? "USDC"}`}
    </button>
  );
});

/**
 * Hook version — returns an imperative `open(overrides?)` function plus a `close()`.
 */
export function useCinchPay(defaults: Omit<PaymentOptions, "merchant" | "amount"> & {
  merchant?: string;
  amount?: string | number;
} = {}) {
  return React.useMemo(
    () => ({
      open: (overrides: Partial<PaymentOptions> = {}) =>
        openCheckout({
          ...defaults,
          ...overrides,
        } as PaymentOptions),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(defaults)],
  );
}
