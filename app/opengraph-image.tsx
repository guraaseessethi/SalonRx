import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Salon Rx, your prescription to beauty. Hair salon in Barrie, Ontario.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (name: string) => readFile(join(process.cwd(), "assets/fonts", name));

/** 1200x630 social image, drawn from the SALON-Rx wordmark. */
export default async function OpengraphImage() {
  const [josefin, josefinBold, cormorant] = await Promise.all([
    font("josefin-300.ttf"),
    font("josefin-600.ttf"),
    font("cormorant-italic-500.ttf"),
  ]);

  const rays = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r2 = i % 3 === 0 ? 290 : i % 3 === 1 ? 268 : 250;
    return {
      x1: 300 + Math.cos(a) * 226,
      y1: 300 + Math.sin(a) * 226,
      x2: 300 + Math.cos(a) * r2,
      y2: 300 + Math.sin(a) * r2,
    };
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#ffffff",
        color: "#111114",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 90,
          width: 800,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "Josefin",
            fontWeight: 300,
            fontSize: 112,
            letterSpacing: 5,
            lineHeight: 1,
          }}
        >
          SAL
          <svg width="98" height="98" viewBox="0 0 100 100" style={{ margin: "0 4px" }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3a7cc4" />
                <stop offset="1" stopColor="#0f3a73" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="49" fill="url(#g)" />
            <path
              d="M50 1.5 C30 14 24 40 36 60 C46 76 66 90 82 95 A49 49 0 0 0 98.5 46 C96 22 76 4 50 1.5 Z"
              fill="#fff"
            />
            <path
              d="M50 1.5 C66 10 76 24 78 40 C70 30 60 24 48 22 C46 14 47 7 50 1.5 Z"
              fill="url(#g)"
            />
            <path d="M61 77 q4.5 -3.5 9 0 q-4.5 4.5 -9 0 Z" fill="#1f5fa6" />
          </svg>
          N
          <span
            style={{
              fontFamily: "Cormorant",
              fontStyle: "italic",
              color: "#1f5fa6",
              fontSize: 128,
              marginLeft: 8,
            }}
          >
            -Rx
          </span>
        </div>
        <div
          style={{
            display: "flex",
            width: 120,
            height: 2,
            background: "#b08d4c",
            margin: "34px 0 26px",
          }}
        />
        <div style={{ fontFamily: "Cormorant", fontStyle: "italic", fontSize: 54 }}>
          your prescription to beauty
        </div>
        <div
          style={{
            fontFamily: "JosefinBold",
            fontSize: 20,
            letterSpacing: 4,
            marginTop: 36,
            color: "#6c6c72",
          }}
        >
          HAIR SALON · 213 BAYFIELD ST · BARRIE
        </div>
      </div>
      <svg
        width="600"
        height="630"
        viewBox="0 0 600 600"
        style={{ position: "absolute", right: -150, top: 15 }}
      >
        <g stroke="#b08d4c" strokeWidth="2">
          {rays.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </g>
        <circle cx="300" cy="300" r="182" fill="#1f5fa6" />
        <path
          d="M320 112 C255 154 240 255 279 333 C306 387 360 435 423 450"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Josefin", data: josefin, weight: 300, style: "normal" },
        { name: "JosefinBold", data: josefinBold, weight: 600, style: "normal" },
        { name: "Cormorant", data: cormorant, weight: 500, style: "italic" },
      ],
    },
  );
}
