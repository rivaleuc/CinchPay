import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./chain";

export const wagmiConfig = getDefaultConfig({
  appName: "cinchpay",
  projectId:
    process.env.NEXT_PUBLIC_WC_PROJECT_ID ||
    "00000000000000000000000000000000",
  chains: [arcTestnet],
  ssr: true,
});
