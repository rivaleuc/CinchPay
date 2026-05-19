# CinchPay

Stablecoin checkout, the way it should feel.

CinchPay turns any wallet address into a merchant account. Customers pay in USDC or EURC, settle in under a second on [Arc Network](https://arc.network), and the funds land directly in the merchant's wallet. No custody, no chargebacks, no payout schedule, no rolling reserves.

## Why it exists

Card processors are built for an internet that no longer fits. A small business in Casablanca selling to a customer in Berlin pays three percent, waits a week for the money, and lives with the threat of a chargeback for another ninety days. Crypto payments solve all of that on paper but in practice the UX is terrible, the wallets are confusing, and there is no clean way to wire it into a normal website.

CinchPay closes that gap. The checkout looks and feels like Stripe. The settlement is final the moment the transaction confirms. The merchant integration is a single button or one line of HTML.

## What it does

Accept USDC and EURC on Arc. Funds move wallet to wallet through an audited processor contract that records every payment onchain with the merchant, amount, token, order id, and optional metadata. Merchants get a hosted checkout, a dashboard that reads payments straight from the chain, refund tooling, and a webhook signed against onchain events for backend fulfillment.

The whole thing runs without a database. Every payment is its own onchain record, which means the dashboard, the receipts, and the dispute history are all reproducible from the chain alone. If CinchPay disappears tomorrow, the merchant still has every payment they ever received, verifiable by anyone.

## Who it is for

Anyone with a wallet and something to sell. Indie creators, Shopify stores selling globally, SaaS founders who want to skip Stripe's underwriting, marketplaces that need instant payouts to sellers, agencies billing international clients in stable value, and any business operating in a country where traditional rails are slow, expensive, or unavailable.

## What makes it different

Settlement is final at block inclusion, not three to seven business days later. There is no merchant account to apply for, the wallet address is the account. Fees are a flat protocol fee, no interchange, no monthly minimum, no statement charges. The integration surface is a single script tag, a typed React component, or a hosted link, so it works on Webflow, Shopify, WordPress, or a hand rolled Next.js app with identical effort. The dashboard is real time because it reads the chain directly, not a delayed batch of webhooks.

## Live

Frontend: [cinchpay.xyz](https://cinchpay.xyz)
Processor contract on Arc Testnet: [`0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36`](https://testnet.arcscan.app/address/0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36)

## License

MIT.
