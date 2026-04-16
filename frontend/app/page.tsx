"use client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: "var(--navy)", minHeight: "100vh" }}>

      {/* ── Navigation ── */}
      <nav style={{ padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1 L14 8 L8 15 L2 8 Z" fill="white" />
            </svg>
          </div>
          <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "white" }}>
            Niveshak360
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--slate2)", cursor: "pointer" }}>Learn</span>
          <span style={{ fontSize: 13, color: "var(--slate2)", cursor: "pointer" }}>Invest</span>
          <button
            className="btn-primary"
            onClick={() => router.push("/auth")}
            style={{ padding: "8px 20px", fontSize: 12 }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 32px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "4px 16px", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em" }}>
            WEALTH MANAGEMENT FOR EVERYONE
          </span>
        </div>
        <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 52, color: "white", lineHeight: 1.15, marginBottom: 20 }}>
          Your financial<br />
          <em style={{ color: "var(--gold2)" }}>journey</em> begins<br />
          today.
        </h1>
        <p style={{ fontSize: 16, color: "var(--slate2)", lineHeight: 1.7, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
          From your first savings goal to a diversified portfolio — Niveshak360 grows with you at every stage of life.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 60 }}>
          <button
            className="btn-primary"
            onClick={() => router.push("/auth")}
            style={{ fontSize: 14, padding: "14px 28px" }}
          >
            Start for free →
          </button>
          <button
            className="btn-outline"
            style={{ fontSize: 14, padding: "14px 28px", borderColor: "rgba(255,255,255,0.2)", color: "white" }}
          >
            Watch demo
          </button>
        </div>

        {/* Trust stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { val: "2M+", label: "Users" },
            { val: "₹840Cr", label: "Assets managed" },
            { val: "4.9★", label: "App rating" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: "white", marginBottom: 4 }}>
                {stat.val}
              </p>
              <p style={{ fontSize: 12, color: "var(--slate2)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Four pillars ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 80px" }}>
        <p style={{ textAlign: "center", fontSize: 11, letterSpacing: "0.1em", color: "var(--slate2)", marginBottom: 24, textTransform: "uppercase" }}>
          Everything you need
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { icon: "📚", title: "Learn", desc: "9 tracks, 80+ bite-sized lessons" },
            { icon: "📈", title: "Invest", desc: "SIPs, ETFs and stocks" },
            { icon: "🎯", title: "Goals", desc: "Milestone-linked saving" },
            { icon: "🏆", title: "FinScore", desc: "Track progress, earn rewards" },
          ].map((item) => (
            <div
              key={item.title}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, textAlign: "center" }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 6 }}>{item.title}</p>
              <p style={{ fontSize: 11, color: "var(--slate2)", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Who it's for ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 32px" }}>
        <p style={{ textAlign: "center", fontSize: 11, letterSpacing: "0.1em", color: "var(--slate2)", marginBottom: 12, textTransform: "uppercase" }}>
          Built for every stage of life
        </p>
        <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 32, color: "white", textAlign: "center", marginBottom: 40 }}>
          Grow with Niveshak360 forever
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", maxWidth: 600, margin: "0 auto 48px" }}>
          {["🎒 School students", "🎓 College", "💼 Professionals", "🏠 Families", "🌅 Retirees"].map((seg) => (
            <span
              key={seg}
              style={{ fontSize: 12, background: "rgba(201,168,76,0.15)", color: "var(--gold2)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.25)" }}
            >
              {seg}
            </span>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <button
            className="btn-primary"
            onClick={() => router.push("/auth")}
            style={{ fontSize: 14, padding: "14px 32px" }}
          >
            Join Niveshak360 — it's free →
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--slate2)" }}>
          © 2026 Niveshak360 · Built with purpose
        </p>
      </div>

    </div>
  );
}