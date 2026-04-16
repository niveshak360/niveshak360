"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

interface User {
  id: number;
  full_name: string;
  email: string;
  finscore: number;
  streak_days: number;
  age_group: string;
}

interface GoalSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_saved: number;
  total_target: number;
  overall_progress_percent: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoalSummary] = useState<GoalSummary | null>(null);
  const [sipResult, setSipResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // SIP calculator state
  const [sipAmount, setSipAmount] = useState(500);
  const [sipYears, setSipYears] = useState(10);
  const [sipRate, setSipRate] = useState(12);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.push("/auth");
      return;
    }

    setUser(JSON.parse(savedUser));
    loadData(token);
  }, []);

  const loadData = async (token: string) => {
    try {
      const [goalsRes, sipRes] = await Promise.all([
        fetch(`${API}/goals/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/sip-calculator?monthly_amount=500&years=10&annual_return_percent=12`),
      ]);

      if (goalsRes.ok) setGoalSummary(await goalsRes.json());
      if (sipRes.ok) setSipResult(await sipRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const calcSip = async () => {
    const res = await fetch(
      `${API}/sip-calculator?monthly_amount=${sipAmount}&years=${sipYears}&annual_return_percent=${sipRate}`
    );
    const data = await res.json();
    setSipResult(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "white", fontFamily: "DM Sans, sans-serif" }}>Loading your dashboard...</p>
      </div>
    );
  }

  const finscoreLevel = () => {
    const s = user?.finscore || 0;
    if (s < 200) return "Curious";
    if (s < 400) return "Learner";
    if (s < 600) return "Saver";
    if (s < 800) return "Investor";
    if (s < 950) return "Wealth Builder";
    return "Niveshak360 Pro";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Top Nav ── */}
      <div style={{ background: "var(--navy)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16"><path d="M8 1 L14 8 L8 15 L2 8 Z" fill="white" /></svg>
          </div>
          <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white" }}>Niveshak360</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span onClick={() => router.push("/goals")} style={{ fontSize: 13, color: "var(--slate2)", cursor: "pointer" }}>Goals</span>
          <span onClick={() => router.push("/learn")} style={{ fontSize: 13, color: "var(--slate2)", cursor: "pointer" }}>Learn</span>
          <span onClick={() => router.push("/invest")} style={{ fontSize: 13, color: "var(--slate2)", cursor: "pointer" }}>Invest</span>
          <button onClick={logout} style={{ fontSize: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Log out
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ background: "var(--navy)", padding: "24px 28px 32px" }}>
        <p style={{ fontSize: 13, color: "var(--slate2)", marginBottom: 4 }}>Good morning 👋</p>
        <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, color: "white", marginBottom: 6 }}>
          {user?.full_name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, background: "rgba(201,168,76,0.2)", color: "var(--gold2)", padding: "3px 10px", borderRadius: 10, border: "1px solid rgba(201,168,76,0.3)" }}>
            {finscoreLevel()}
          </span>
          <span style={{ fontSize: 12, color: "var(--slate2)" }}>🔥 {user?.streak_days} day streak</span>
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "FinScore", value: user?.finscore || 0, color: "var(--gold)", bg: "var(--gold3)" },
            { label: "Active Goals", value: goals?.active_goals || 0, color: "var(--purple)", bg: "var(--purple2)" },
            { label: "Total Saved", value: `₹${(goals?.total_saved || 0).toLocaleString("en-IN")}`, color: "var(--green)", bg: "var(--green2)" },
            { label: "Progress", value: `${goals?.overall_progress_percent || 0}%`, color: "var(--teal)", bg: "var(--teal2)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: "16px 18px", border: `1px solid ${stat.color}22` }}>
              <p style={{ fontSize: 11, color: stat.color, marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 26, color: "var(--navy)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Goals summary */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--slate3)", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, color: "var(--navy)" }}>Goals</h2>
              <button onClick={() => router.push("/goals")} style={{ fontSize: 12, color: "var(--gold)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                View all →
              </button>
            </div>
            {goals && goals.total_goals > 0 ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--slate)" }}>Overall progress</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)" }}>{goals.overall_progress_percent}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--slate4)", borderRadius: 3 }}>
                    <div style={{ width: `${goals.overall_progress_percent}%`, height: "100%", background: "var(--gold)", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "var(--green2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--green)" }}>{goals.active_goals}</p>
                    <p style={{ fontSize: 11, color: "var(--teal)" }}>Active</p>
                  </div>
                  <div style={{ flex: 1, background: "var(--gold3)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--gold)" }}>{goals.completed_goals}</p>
                    <p style={{ fontSize: 11, color: "var(--gold)" }}>Completed</p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 12 }}>No goals yet. Create your first goal!</p>
                <button onClick={() => router.push("/goals")} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                  + Create goal
                </button>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--slate3)", padding: 20 }}>
            <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, color: "var(--navy)", marginBottom: 16 }}>Quick actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🎯", label: "Create a new goal", path: "/goals", color: "var(--purple2)" },
                { icon: "📚", label: "Continue learning", path: "/learn", color: "var(--teal2)" },
                { icon: "📈", label: "Explore investments", path: "/invest", color: "var(--gold3)" },
              ].map((action) => (
                <div
                  key={action.label}
                  onClick={() => router.push(action.path)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: action.color, borderRadius: 12, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 20 }}>{action.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{action.label}</span>
                  <span style={{ marginLeft: "auto", color: "var(--slate2)", fontSize: 16 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SIP Calculator ── */}
        <div style={{ background: "var(--navy)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white", marginBottom: 4 }}>
            SIP Calculator
          </h2>
          <p style={{ fontSize: 12, color: "var(--slate2)", marginBottom: 20 }}>
            See how your money grows with monthly investing
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Monthly amount (₹)", value: sipAmount, setter: setSipAmount, min: 100, max: 10000, step: 100 },
              { label: "Duration (years)", value: sipYears, setter: setSipYears, min: 1, max: 30, step: 1 },
              { label: "Expected return (%)", value: sipRate, setter: setSipRate, min: 4, max: 20, step: 1 },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--slate2)" }}>{s.label}</label>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gold2)" }}>{s.value}</span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.value}
                  onChange={(e) => { s.setter(Number(e.target.value)); }}
                  style={{ width: "100%", accentColor: "var(--gold)" }}
                />
              </div>
            ))}
          </div>

          <button onClick={calcSip} style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginBottom: 16 }}>
            Calculate →
          </button>

          {sipResult && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "You invest", value: `₹${sipResult.total_invested.toLocaleString("en-IN")}` },
                { label: "Maturity value", value: `₹${sipResult.maturity_value.toLocaleString("en-IN")}` },
                { label: "Wealth gain", value: `+${sipResult.wealth_gain_percent}%` },
              ].map((r) => (
                <div key={r.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 10, color: "var(--slate2)", marginBottom: 4 }}>{r.label}</p>
                  <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, color: "white" }}>{r.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}