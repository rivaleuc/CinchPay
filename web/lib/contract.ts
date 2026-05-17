export const PROCESSOR_ADDRESS =
  (process.env.NEXT_PUBLIC_PROCESSOR_ADDRESS as `0x${string}`) ||
  "0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36";

export const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;
export const EURC_ADDRESS =
  "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const;

export const TOKENS = {
  USDC: { address: USDC_ADDRESS, symbol: "USDC", decimals: 6 },
  EURC: { address: EURC_ADDRESS, symbol: "EURC", decimals: 6 },
} as const;

export type TokenKey = keyof typeof TOKENS;

export const PROCESSOR_ABI = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "paymentId", type: "bytes32" },
      { name: "metadata", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "customer", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "paymentId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint16" }],
  },
  {
    type: "function",
    name: "consumed",
    stateMutability: "view",
    inputs: [{ type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "acceptedTokens",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "Payment",
    inputs: [
      { name: "merchant", type: "address", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "grossAmount", type: "uint256", indexed: false },
      { name: "netAmount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "paymentId", type: "bytes32", indexed: false },
      { name: "metadata", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Refund",
    inputs: [
      { name: "merchant", type: "address", indexed: true },
      { name: "customer", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "paymentId", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

export const EXPLORER = "https://testnet.arcscan.app";
