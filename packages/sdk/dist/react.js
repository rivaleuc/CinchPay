import { jsx as _jsx } from "react/jsx-runtime";
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
/**
 * A drop-in `<button>` that opens the CinchPay checkout modal on click.
 * Forwards all standard button attrs (className, style, disabled, etc.).
 */
export const CinchPayButton = React.forwardRef(function CinchPayButton({ merchant, amount, token, orderId, paymentId, returnUrl, cancelUrl, onSuccess, onClose, onReady, children, ...rest }, ref) {
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
    return (_jsx("button", { ref: ref, type: "button", onClick: handle, ...rest, children: children ?? `Pay ${amount} ${token ?? "USDC"}` }));
});
/**
 * Hook version — returns an imperative `open(overrides?)` function plus a `close()`.
 */
export function useCinchPay(defaults = {}) {
    return React.useMemo(() => ({
        open: (overrides = {}) => openCheckout({
            ...defaults,
            ...overrides,
        }),
    }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(defaults)]);
}
//# sourceMappingURL=react.js.map