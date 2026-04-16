"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

interface Goal {
  id: number;
  name: string;
  icon: string;
  category: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  target_date: string;
  is_completed: boolean;
  progress_percent: number;
  remaining_amount: number;
}

const GOAL_ICONS = ["💻", "✈️", "🏠", "🎓", "🛡️", "🚗", "💍", "🏥", "📱", "🌅"];
const CATEGORIES = [
  { val: "short-term", label: "⚡ Short-term (< 1 yr)" },
  { val: "medium-term", label: "🏍️ Medium-term (1–5 yr)" },
  { val: "long-term", label: "🏠 Long-term (5+ yr)" },
];

export default function GoalsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState<Goal | null>(null);
  const [contributeAmt, setContributeAmt] = useState(1000);
  const [creating, setCreating] = useState(false);

  // New goal form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💻");
  const [category, setCategory] = useState("short-term");
  const [targetAmount, setTargetAmount] = useState(50000);
  const [monthlyContrib, setMonthlyContrib] = useState(2000);
  const [targetDate, setTargetDate] = useState("2027-01-01");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/auth"); return; }
    setToken(t);
    loadGoals(t);
  }, []);

  const loadGoals = async (t: string) => {
    try {
      const res = await fetch(`${API}/goals`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setGoals(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createGoal = async () => {
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name, icon, category,
          target_amount: targetAmount,
          monthly_contribution: monthlyContrib,
          target_date: targetDate,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setName(""); setIcon("💻"); setTargetAmount(50000); setMonthlyContrib(2000);
        loadGoals(token);
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const contribute = async () => {
    if (!showContribute) return;
    try {
      const res = await fetch(`${API}/goals/${showContribute.id}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: contributeAmt }),
      });
      if (res.ok) {
        setShowContribute(null);
        loadGoals(token);
      }
    } catch (e) { console.error(e); }
  };

  const deleteGoal = async (id: number) => {
    await fetch(`${API}/goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadGoals(token);
  };

  const monthlyNeeded = targetAmount && targetDate
    ? Math.ceil(targetAmount / Math.max(1,
        Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      ))
    : 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontFamily: "DM Sans, sans-serif" }}>Loading goals...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "DM Sans, sans-serif" }}>

      {/* Nav */}
      <div style={{ background: "var(--navy)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span onClick={() => router.push("/dashboard")} style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white", cursor: "pointer" }}>
          ← Niveshak360
        </span>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
        >
          + New goal
        </button>
      </div>

      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "20px 28px 32px" }}>
        <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 26, color: "white", marginBottom: 4 }}>
          Your Goals
        </h1>
        <p style={{ fontSize: 13, color: "var(--slate2)" }}>
          {goals.length} active · Every rupee has a purpose
        </p>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 800, margin: "0 auto" }}>

        {/* Empty state */}
        {goals.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🎯</p>
            <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "var(--navy)", marginBottom: 8 }}>
              No goals yet
            </h2>
            <p style={{ fontSize: 14, color: "var(--slate)", marginBottom: 24 }}>
              Create your first goal and start saving with purpose
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{ background: "var(--navy)", color: "white", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
            >
              + Create my first goal
            </button>
          </div>
        )}

        {/* Goal cards */}
        {goals.map((goal) => (
          <div key={goal.id} style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--slate4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {goal.icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{goal.name}</p>
                  <p style={{ fontSize: 11, color: "var(--slate)" }}>{goal.category} · Due {goal.target_date}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>
                  ₹{goal.saved_amount.toLocaleString("en-IN")}
                </p>
                <p style={{ fontSize: 11, color: "var(--slate)" }}>
                  of ₹{goal.target_amount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: "var(--slate4)", borderRadius: 3, marginBottom: 8 }}>
              <div style={{
                width: `${Math.min(goal.progress_percent, 100)}%`,
                height: "100%", borderRadius: 3,
                background: goal.is_completed ? "var(--green)" : "var(--gold)",
                transition: "width 0.5s ease",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: goal.is_completed ? "var(--green)" : "var(--gold)", fontWeight: 500 }}>
                {goal.is_completed ? "✅ Completed!" : `${goal.progress_percent}% complete`}
              </p>
              <p style={{ fontSize: 12, color: "var(--slate)" }}>
                ₹{goal.remaining_amount.toLocaleString("en-IN")} to go
              </p>
            </div>

            {/* Action buttons */}
            {!goal.is_completed && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setShowContribute(goal); setContributeAmt(goal.monthly_contribution || 1000); }}
                  style={{ flex: 1, background: "var(--navy)", color: "white", border: "none", padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  + Add money
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--slate3)", borderRadius: 10, fontSize: 12, color: "var(--slate)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Create Goal Modal ── */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "var(--navy)" }}>New goal</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "var(--slate)" }}>✕</button>
            </div>

            {/* Icon picker */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>Choose an icon</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {GOAL_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${icon === ic ? "var(--navy)" : "var(--slate3)"}`, background: icon === ic ? "var(--slate4)" : "white", fontSize: 20, cursor: "pointer" }}
                >
                  {ic}
                </button>
              ))}
            </div>

            {/* Goal name */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Goal name</p>
            <input
              type="text"
              placeholder="e.g. New Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 14 }}
            />

            {/* Category */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>Category</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.val}
                  onClick={() => setCategory(c.val)}
                  style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${category === c.val ? "var(--navy)" : "var(--slate3)"}`, background: category === c.val ? "var(--navy)" : "white", color: category === c.val ? "white" : "var(--navy)", fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "DM Sans, sans-serif" }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Target amount */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Target amount (₹)</p>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 14 }}
            />

            {/* Monthly contribution */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Monthly contribution (₹)</p>
            <input
              type="number"
              value={monthlyContrib}
              onChange={(e) => setMonthlyContrib(Number(e.target.value))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 14 }}
            />

            {/* Target date */}
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Target date</p>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 16 }}
            />

            {/* AI suggestion */}
            {name && targetAmount > 0 && (
              <div style={{ background: "var(--navy)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "var(--gold2)", marginBottom: 4, fontWeight: 500 }}>
                  Niveshak360 suggestion
                </p>
                <p style={{ fontSize: 13, color: "white" }}>
                  Save <strong style={{ color: "var(--gold2)" }}>₹{monthlyNeeded.toLocaleString("en-IN")}/month</strong> to reach your goal on time
                </p>
              </div>
            )}

            <button
              onClick={createGoal}
              disabled={creating || !name}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: creating || !name ? "var(--slate3)" : "var(--gold)", color: creating || !name ? "var(--slate)" : "var(--navy)", fontSize: 14, fontWeight: 500, cursor: creating || !name ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif" }}
            >
              {creating ? "Creating..." : "Create goal →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Contribute Modal ── */}
      {showContribute && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--navy)" }}>
                Add money to {showContribute.name}
              </h2>
              <button onClick={() => setShowContribute(null)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "var(--slate)" }}>✕</button>
            </div>

            <p style={{ fontSize: 12, color: "var(--slate)", marginBottom: 16 }}>
              Current: ₹{showContribute.saved_amount.toLocaleString("en-IN")} · Target: ₹{showContribute.target_amount.toLocaleString("en-IN")}
            </p>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setContributeAmt(amt)}
                  style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid ${contributeAmt === amt ? "var(--navy)" : "var(--slate3)"}`, background: contributeAmt === amt ? "var(--navy)" : "white", color: contributeAmt === amt ? "white" : "var(--navy)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={contributeAmt}
              onChange={(e) => setContributeAmt(Number(e.target.value))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 16 }}
            />

            <button
              onClick={contribute}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "var(--gold)", color: "var(--navy)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
            >
              Add ₹{contributeAmt.toLocaleString("en-IN")} →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}