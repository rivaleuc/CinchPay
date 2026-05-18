# @cinchpay/sdk

USDC checkout for any site. Settled on [Arc Network](https://arc.network) in under a second.

## Install

### pnpm (recommended)

```bash
# Install from the GitHub source — no npm registry, no version drift
pnpm add github:rivaleuc/CinchPay#path:packages/sdk
```

### Other package managers

```bash
npm install github:rivaleuc/CinchPay#path:packages/sdk
yarn add github:rivaleuc/CinchPay#path:packages/sdk
bun add github:rivaleuc/CinchPay#path:packages/sdk
```

> **Why install from git instead of npm?** No old hijacked versions, no supply-chain surface, no registry trust. You pin to a specific commit or tag and audit the source yourself.

## Quick start

### Vanilla / TypeScript

```ts
import { CinchPay } from "@cinchpay/sdk";

CinchPay.open({
  merchant: "0x8a3f1234c21d56789abcdef0123456789abcdef0",
  amount: 29.99,
  token: "USDC",
  orderId: "ORDER-001",
  onSuccess: ({ txHash, paymentId }) => {
    fetch("/api/orders/fulfill", {
      method: "POST",
      body: JSON.stringify({ paymentId, txHash }),
    });
  },
  onClose: () => console.log("cancelled"),
});
```

### React

```tsx
import { CinchPayButton } from "@cinchpay/sdk/react";

export function Buy() {
  return (
    <CinchPayButton
      merchant="0x8a3f1234c21d56789abcdef0123456789abcdef0"
      amount={29.99}
      token="USDC"
      orderId="ORDER-001"
      onSuccess={({ txHash }) => console.log("paid", txHash)}
      className="bg-blue-600 text-white px-5 py-3 rounded-md"
    >
      Pay $29.99 USDC
    </CinchPayButton>
  );
}
```

### React hook (imperative)

```tsx
import { useCinchPay } from "@cinchpay/sdk/react";

function Buy() {
  const cinch = useCinchPay({
    merchant: "0x...",
    token: "USDC",
    onSuccess: (p) => fulfill(p),
  });

  return (
    <button onClick={() => cinch.open({ amount: 29.99, orderId: "ORD-001" })}>
      Pay
    </button>
  );
}
```

## API

### `CinchPay.open(opts) → OpenHandle`

| Option | Type | Required | Description |
|---|---|---|---|
| `merchant` | `string` | ✅ | Wallet address receiving funds |
| `amount` | `string \| number` | ✅ | Decimal amount, e.g. `"29.99"` |
| `token` | `"USDC" \| "EURC"` | — | Token to pay in (default `USDC`) |
| `orderId` | `string` | — | Your internal order id, echoed back |
| `paymentId` | `0x...` | — | 32-byte hex, auto-generated if omitted |
| `returnUrl` | `string` | — | Redirect target on success |
| `cancelUrl` | `string` | — | Redirect target on cancel |
| `onSuccess` | `(payload) => void` | — | Fired when settlement confirms onchain |
| `onClose` | `(payload) => void` | — | Fired when user dismisses |
| `onReady` | `(payload) => void` | — | Fired when iframe loads |

Returns `{ close, paymentId }`.

### `CinchPay.configure({ origin })`

Override the checkout origin (defaults to `https://cinchpay.app`). Useful for self-hosted deployments.

### `CinchPay.newPaymentId()`

Generate a 32-byte hex payment id (pre-create them server-side for idempotency).

### `CinchPay.close()`

Force-close the modal.

## Self-host

The SDK only handles the modal & messaging — settlement happens against the on-chain `CinchPayProcessor` contract. To self-host, fork this repo, deploy your own `/checkout` page, and configure the SDK origin:

```ts
import { configure } from "@cinchpay/sdk";

configure({ origin: "https://pay.yoursite.com" });
```

## Backend fulfillment

Listen for `Payment` events directly from the chain — no centralized webhook server:

```ts
import { createPublicClient, http, parseAbiItem } from "viem";

const client = createPublicClient({
  chain: {
    id: 5042002,
    rpcUrls: { default: { http: ["https://rpc.drpc.testnet.arc.network"] } },
  },
  transport: http(),
});

client.watchEvent({
  address: "0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36",
  event: parseAbiItem(
    "event Payment(address indexed merchant, address indexed payer, address indexed token, uint256 grossAmount, uint256 netAmount, uint256 fee, bytes32 paymentId, bytes32 metadata)"
  ),
  args: { merchant: "0xYourMerchantAddress" },
  onLogs: async (logs) => {
    for (const log of logs) await fulfillOrder(log);
  },
});
```

## License

MIT
