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
            "radial-gradient(circle at 80% 20%, rgba(91, 140, 255, 0.10), transparent 60%), #f0f5fb",
          padding: "72px",
          fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 500, color: "#161821", letterSpacing: "-0.02em" }}>
            Cinch
          </span>
          <span
            style={{
              fontSize: 32,
              fontStyle: "italic",
              color: "#5b8cff",
              letterSpacing: "-0.02em",
            }}
          >
            Pay
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              color: "#5d6680",
              textTransform: "uppercase",
              letterSpacing: "0.20em",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            <div style={{ width: 32, height: 1, background: "#b0bccc" }} />
            Version 0.1 · Live on Arc Testnet
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 400,
              color: "#161821",
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              maxWidth: 980,
            }}
          >
            Stablecoin checkout, refined for the open web.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            color: "#5d6680",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span>cinchpay · settles in &lt;1s</span>
          <span>1.00% processor fee · MIT</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
