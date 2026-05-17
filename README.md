# CinchPay

Stablecoin checkout for any site, built on [Arc Network](https://arc.network).

Drop in an iframe, link, or modal. Receive USDC directly in your wallet with sub-second settlement.

## Stack

- **Contracts** — Solidity 0.8.30, OpenZeppelin, Foundry
- **Frontend** — Next.js 16, Wagmi v2, Viem, RainbowKit, Tailwind v4
- **Network** — Arc Testnet (chain id `5042002`)

## Layout

```
contracts/   Solidity contracts + Foundry tests
web/         Next.js dApp (landing, checkout, demo, dashboard, docs)
```

## Contract

Deployed on Arc Testnet:

```
CinchPayProcessor: 0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36
```

[View on ArcScan](https://testnet.arcscan.app/address/0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36)

## Develop

### Contracts

```bash
cd contracts
forge install
forge test
```

### Frontend

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy contract

```bash
cd contracts
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.drpc.testnet.arc.network \
  --broadcast --slow
```

## Integration

Three integration paths — see `/integrate` on the running app.

### Payment link

```
https://cinchpay.app/checkout?merchant=0xYourWallet&amount=29.99&token=USDC&orderId=ORD_001
```

### Embed iframe

```html
<iframe
  src="https://cinchpay.app/checkout?merchant=0xYourWallet&amount=29.99&token=USDC"
  width="420" height="640"
  style="border:0;border-radius:16px;">
</iframe>
```

### Modal with callbacks

```js
window.addEventListener("message", (e) => {
  if (e.data?.type === "cinchpay:success") {
    fulfillOrder(e.data.payload.orderId);
  }
});
```

## License

MIT
