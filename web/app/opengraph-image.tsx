import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CinchPay — Stablecoin checkout for any site";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 30% 30%, rgba(91,140,255,0.15), transparent 60%), #07080a",
          padding: "72px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #5b8cff, #3b5fcc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1.5px solid rgba(255,255,255,0.35)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#f4f4f5",
              letterSpacing: "-0.02em",
            }}
          >
            CinchPay
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              color: "#a1a1aa",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#5b8cff",
              }}
            />
            Live on Arc Testnet
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              color: "#f4f4f5",
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              maxWidth: 980,
            }}
          >
            USDC checkout for any site.
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 500,
              color: "#52525b",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            5 lines of code.
          </div>
        </div>

        {/* Bottom: meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#52525b",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span>cinchpay · sub-second settlement</span>
          <span>v0.1.0 · testnet</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
