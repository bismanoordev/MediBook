import { ImageResponse } from "next/og"

export const alt = "MediBook — healthcare appointments made simple"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#E7F7F5", color: "#0F172A", fontFamily: "Arial, sans-serif" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 460, height: 460, borderRadius: "50%", border: "46px solid #CCFBF1" }} />
        <div style={{ position: "absolute", left: -100, bottom: -160, width: 500, height: 500, borderRadius: "50%", background: "#B8EEE8" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", padding: "76px 88px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32, fontWeight: 700 }}>
            <div style={{ width: 62, height: 62, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "#0F766E" }}>
              <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
                <path d="M24 40S7 30.5 7 17.5C7 11.7 11.5 8 16.3 8C20 8 22.6 10.1 24 13C25.4 10.1 28 8 31.7 8C36.5 8 41 11.7 41 17.5C41 30.5 24 40 24 40Z" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.5 24H18L20.5 19.5L24 29L27 23.5H35.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            MediBook
          </div>
          <div style={{ display: "flex", marginTop: 58, fontSize: 70, fontWeight: 700, lineHeight: 1.08, letterSpacing: -3 }}>Care that fits your life.</div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 760, color: "#475569", fontSize: 30, lineHeight: 1.35 }}>Find trusted doctors, view live availability, and book your next clinic appointment with confidence.</div>
          <div style={{ display: "flex", marginTop: 42, color: "#0F766E", fontSize: 24, fontWeight: 700 }}>Healthcare appointments, made simple</div>
        </div>
      </div>
    ),
    size,
  )
}
