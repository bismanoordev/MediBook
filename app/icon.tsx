import { ImageResponse } from "next/og"

export const size = {
  width: 64,
  height: 64,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F766E",
          borderRadius: "16px",
          color: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        +
      </div>
    ),
    size,
  )
}
