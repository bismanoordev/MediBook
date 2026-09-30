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
        }}
      >
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <path d="M24 40S7 30.5 7 17.5C7 11.7 11.5 8 16.3 8C20 8 22.6 10.1 24 13C25.4 10.1 28 8 31.7 8C36.5 8 41 11.7 41 17.5C41 30.5 24 40 24 40Z" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 24H18L20.5 19.5L24 29L27 23.5H35.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  )
}
