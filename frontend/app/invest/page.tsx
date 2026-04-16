"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

interface Fund {
  id: number;
  name: string;
  category: string;
  risk_level: string;
  min_sip_amount: number;
  one_year_return: number;
  three_year_return: number;
  nav: number;
  description: string;
}

interface Holding {
  id: number;
  symbol: string;
  name: string;
  holding_type: string;
  units: number;
  average_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_profit_loss: number;
  total_profit_loss_percent: number;
  cash_remaining: number;
  number_of_holdings: number;
}

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  low:      { bg: "var(--green2)",  color: "var(--green)"  },
  moderate: { bg: "var(--gold3)",   color: "var(--gold)"   },
  high:     { bg: "var(--red2)",    color: "var(--red)"    },
};

export default function InvestPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"funds" | "sip" | "virtual">("funds");
  const [funds, setFunds] = useState<Fund[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");

  // SIP form
  const [sipAmount, setSipAmount] = useState(500);
  const [sipDate, setSipDate] = useState(5);
  const [sipMsg, setSipMsg] = useState("");

  // Virtual trade form
  const [tradeSymbol, setTradeSymbol] = useState("NIFTY50");
  const [tradeName, setTradeName] = useState("Nifty 50 ETF");
  const [tradeUnits, setTradeUnits] = useState(10);
  const [tradePrice, setTradePrice] = useState(213.45);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeMsg, setTradeMsg] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/auth"); return; }
    setToken(t);
    loadData(t);
  }, []);

  const loadData = async (t: string) => {
    try {
      const [fundsRes, holdingsRes, portfolioRes] = await Promise.all([
        fetch(`${API}/invest/funds`),
        fetch(`${API}/invest/virtual/holdings`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/invest/virtual/portfolio`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (fundsRes.ok) setFunds(await fundsRes.json());
      if (holdingsRes.ok) setHoldings(await holdingsRes.json());
      if (portfolioRes.ok) setPortfolio(await portfolioRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const startSip = async () => {
    if (!selectedFund) return;
    setSipMsg("");
    const res = await fetch(`${API}/invest/sips`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fund_id: selectedFund.id, monthly_amount: sipAmount, sip_date: sipDate }),
    });
    const data = await res.json();
    if (res.ok) {
      setSipMsg(`✅ SIP started! ₹${sipAmount}/month on the ${sipDate}th`);
      setSelectedFund(null);
    } else {
      setSipMsg(`❌ ${data.detail}`);
    }
  };

  const makeTrade = async () => {
    setTradeMsg("");
    const res = await fetch(`${API}/invest/virtual/trade?user_id=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        symbol: tradeSymbol,
        name: tradeName,
        holding_type: "etf",
        transaction_type: tradeType,
        units: tradeUnits,
        price_per_unit: tradePrice,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setTradeMsg(`✅ ${tradeType === "buy" ? "Bought" : "Sold"} ${tradeUnits} units of ${tradeSymbol}`);
      loadData(token);
    } else {
      setTradeMsg(`❌ ${data.detail}`);
    }
  };

  const filteredFunds = filterCategory === "all"
    ? funds
    : funds.filter((f) => f.category === filterCategory);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontFamily: "DM Sans, sans-serif" }}>Loading investments...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "DM Sans, sans-serif" }}>

      {/* Nav */}
      <div style={{ background: "var(--navy)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span onClick={() => router.push("/dashboard")} style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white", cursor: "pointer" }}>
          ← Niveshak360
        </span>
        <span style={{ fontSize: 13, color: "var(--gold2)" }}>
          Virtual cash: ₹{portfolio?.cash_remaining.toLocaleString("en-IN") || "1,00,000"}
        </span>
      </div>

      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "20px 28px 28px" }}>
        <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 26, color: "white", marginBottom: 4 }}>
          Invest
        </h1>
        <p style={{ fontSize: 13, color: "var(--slate2)", marginBottom: 16 }}>
          Explore funds, start SIPs, and practice with virtual trading
        </p>

        {/* Portfolio mini summary */}
        {portfolio && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Invested", value: `₹${portfolio.total_invested.toLocaleString("en-IN")}` },
              { label: "Current value", value: `₹${portfolio.current_value.toLocaleString("en-IN")}` },
              { label: "P&L", value: `${portfolio.total_profit_loss >= 0 ? "+" : ""}₹${portfolio.total_profit_loss.toLocaleString("en-IN")}` },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: 10, color: "var(--slate2)", marginBottom: 3 }}>{s.label}</p>
                <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, color: "white" }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "16px 28px 0" }}>
        <div style={{ display: "flex", background: "white", border: "1px solid var(--slate3)", borderRadius: 14, padding: 4, gap: 4, maxWidth: 400 }}>
          {(["funds", "sip", "virtual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: tab === t ? "var(--navy)" : "transparent", color: tab === t ? "white" : "var(--slate)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.2s" }}
            >
              {t === "funds" ? "📊 Funds" : t === "sip" ? "🔄 SIP" : "🎮 Virtual"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 28px", maxWidth: 800, margin: "0 auto" }}>

        {/* ── FUNDS TAB ── */}
        {tab === "funds" && (
          <div>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["all", "etf", "equity", "debt", "gold"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500, border: `1.5px solid ${filterCategory === cat ? "var(--navy)" : "var(--slate3)"}`, background: filterCategory === cat ? "var(--navy)" : "white", color: filterCategory === cat ? "white" : "var(--navy)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {filteredFunds.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid var(--slate3)" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📈</p>
                <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--navy)", marginBottom: 8 }}>
                  No funds yet
                </h2>
                <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 4 }}>
                  Add funds via the API to see them here.
                </p>
                <p style={{ fontSize: 12, color: "var(--slate2)" }}>
                  Go to <strong>localhost:8000/docs</strong> → POST /invest/funds
                </p>
              </div>
            ) : (
              filteredFunds.map((fund) => {
                const rc = RISK_COLORS[fund.risk_level] || RISK_COLORS.moderate;
                return (
                  <div key={fund.id} style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 20, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{fund.name}</p>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: rc.bg, color: rc.color, fontWeight: 500 }}>
                            {fund.risk_level} risk
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--slate)" }}>
                          {fund.category.toUpperCase()} · Min SIP ₹{fund.min_sip_amount} · NAV ₹{fund.nav}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 16, fontWeight: 500, color: "var(--green)" }}>+{fund.one_year_return}%</p>
                        <p style={{ fontSize: 11, color: "var(--slate)" }}>1Y return</p>
                      </div>
                    </div>

                    {fund.description && (
                      <p style={{ fontSize: 12, color: "var(--slate)", marginBottom: 14, lineHeight: 1.6 }}>{fund.description}</p>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => { setSelectedFund(fund); setSipAmount(fund.min_sip_amount); setTab("sip"); }}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "var(--navy)", color: "white", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                      >
                        Start SIP →
                      </button>
                      <button
                        onClick={() => { setTradeSymbol(fund.name.replace(/\s+/g, "").toUpperCase()); setTradeName(fund.name); setTradePrice(fund.nav); setTab("virtual"); }}
                        style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--slate3)", background: "transparent", color: "var(--navy)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                      >
                        🎮 Virtual buy
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SIP TAB ── */}
        {tab === "sip" && (
          <div>
            <div style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--navy)", marginBottom: 4 }}>
                Start a SIP
              </h2>
              <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 20 }}>
                Systematic Investment Plan — invest a fixed amount every month automatically
              </p>

              {/* Fund selector */}
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>Select fund</p>
              {funds.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 16 }}>No funds available. Add funds first via the API.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {funds.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFund(f)}
                      style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${selectedFund?.id === f.id ? "var(--navy)" : "var(--slate3)"}`, background: selectedFund?.id === f.id ? "var(--navy)" : "white", color: selectedFund?.id === f.id ? "white" : "var(--navy)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "DM Sans, sans-serif", display: "flex", justifyContent: "space-between" }}
                    >
                      <span>{f.name}</span>
                      <span style={{ opacity: 0.7 }}>+{f.one_year_return}% · Min ₹{f.min_sip_amount}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Monthly amount */}
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Monthly amount (₹)</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} onClick={() => setSipAmount(amt)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, border: `1.5px solid ${sipAmount === amt ? "var(--navy)" : "var(--slate3)"}`, background: sipAmount === amt ? "var(--navy)" : "white", color: sipAmount === amt ? "white" : "var(--navy)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <input type="number" value={sipAmount} onChange={(e) => setSipAmount(Number(e.target.value))} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 14 }} />

              {/* SIP date */}
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>SIP date (day of month)</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <button key={d} onClick={() => setSipDate(d)} style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${sipDate === d ? "var(--navy)" : "var(--slate3)"}`, background: sipDate === d ? "var(--navy)" : "white", color: sipDate === d ? "white" : "var(--navy)", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                    {d}
                  </button>
                ))}
              </div>

              {/* AI projection */}
              {selectedFund && sipAmount > 0 && (
                <div style={{ background: "var(--navy)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "var(--gold2)", marginBottom: 6, fontWeight: 500 }}>10-year projection at {selectedFund.one_year_return}% return</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, color: "var(--slate2)" }}>You invest</p>
                      <p style={{ fontSize: 16, color: "white", fontFamily: "DM Serif Display, serif" }}>₹{(sipAmount * 120).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: "var(--slate2)" }}>Estimated value</p>
                      <p style={{ fontSize: 16, color: "var(--gold2)", fontFamily: "DM Serif Display, serif" }}>
                        ₹{Math.round(sipAmount * ((Math.pow(1 + selectedFund.one_year_return / 100 / 12, 120) - 1) / (selectedFund.one_year_return / 100 / 12)) * (1 + selectedFund.one_year_return / 100 / 12)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sipMsg && (
                <div style={{ background: sipMsg.startsWith("✅") ? "var(--green2)" : "var(--red2)", border: `1px solid ${sipMsg.startsWith("✅") ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: sipMsg.startsWith("✅") ? "var(--green)" : "var(--red)" }}>{sipMsg}</p>
                </div>
              )}

              <button
                onClick={startSip}
                disabled={!selectedFund}
                style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: selectedFund ? "var(--gold)" : "var(--slate3)", color: selectedFund ? "var(--navy)" : "var(--slate)", fontSize: 14, fontWeight: 500, cursor: selectedFund ? "pointer" : "not-allowed", fontFamily: "DM Sans, sans-serif" }}
              >
                {selectedFund ? `Start ₹${sipAmount.toLocaleString("en-IN")}/month SIP →` : "Select a fund first"}
              </button>
            </div>
          </div>
        )}

        {/* ── VIRTUAL PORTFOLIO TAB ── */}
        {tab === "virtual" && (
          <div>
            {/* Portfolio summary */}
            {portfolio && (
              <div style={{ background: "var(--navy)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--slate2)", marginBottom: 3 }}>Virtual portfolio value</p>
                    <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, color: "white" }}>
                      ₹{portfolio.current_value.toLocaleString("en-IN")}
                    </p>
                    <p style={{ fontSize: 12, color: portfolio.total_profit_loss >= 0 ? "#4ade80" : "#f87171", marginTop: 4 }}>
                      {portfolio.total_profit_loss >= 0 ? "+" : ""}₹{portfolio.total_profit_loss.toLocaleString("en-IN")} ({portfolio.total_profit_loss_percent}%)
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "var(--slate2)", marginBottom: 3 }}>Cash remaining</p>
                    <p style={{ fontSize: 18, color: "var(--gold2)", fontFamily: "DM Serif Display, serif" }}>
                      ₹{portfolio.cash_remaining.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Holdings */}
            {holdings.length > 0 && (
              <div style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--slate4)" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Your holdings</p>
                </div>
                {holdings.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--slate4)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--slate4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{h.name}</p>
                      <p style={{ fontSize: 11, color: "var(--slate)" }}>{h.units} units · Avg ₹{h.average_buy_price}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>₹{h.current_value.toLocaleString("en-IN")}</p>
                      <p style={{ fontSize: 11, color: h.profit_loss >= 0 ? "var(--green)" : "var(--red)" }}>
                        {h.profit_loss >= 0 ? "+" : ""}₹{h.profit_loss} ({h.profit_loss_percent}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trade form */}
            <div style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--navy)", marginBottom: 4 }}>
                Make a virtual trade
              </h2>
              <p style={{ fontSize: 12, color: "var(--slate)", marginBottom: 20 }}>
                Practice buying and selling with your ₹1,00,000 virtual cash — no real money involved
              </p>

              {/* Buy / Sell toggle */}
              <div style={{ display: "flex", background: "var(--slate4)", borderRadius: 12, padding: 4, marginBottom: 16, maxWidth: 200 }}>
                {(["buy", "sell"] as const).map((t) => (
                  <button key={t} onClick={() => setTradeType(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: tradeType === t ? (t === "buy" ? "var(--green)" : "var(--red)") : "transparent", color: tradeType === t ? "white" : "var(--slate)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                    {t === "buy" ? "Buy" : "Sell"}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Symbol</p>
                  <input type="text" value={tradeSymbol} onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Name</p>
                  <input type="text" value={tradeName} onChange={(e) => setTradeName(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Units</p>
                  <input type="number" value={tradeUnits} onChange={(e) => setTradeUnits(Number(e.target.value))} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Price per unit (₹)</p>
                  <input type="number" value={tradePrice} onChange={(e) => setTradePrice(Number(e.target.value))} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--slate3)", fontSize: 13, color: "var(--navy)", fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                </div>
              </div>

              {/* Trade summary */}
              <div style={{ background: "var(--slate4)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--navy)" }}>Total {tradeType === "buy" ? "cost" : "proceeds"}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", fontFamily: "DM Serif Display, serif" }}>
                  ₹{(tradeUnits * tradePrice).toLocaleString("en-IN")}
                </span>
              </div>

              {tradeMsg && (
                <div style={{ background: tradeMsg.startsWith("✅") ? "var(--green2)" : "var(--red2)", border: `1px solid ${tradeMsg.startsWith("✅") ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: tradeMsg.startsWith("✅") ? "var(--green)" : "var(--red)" }}>{tradeMsg}</p>
                </div>
              )}

              <button
                onClick={makeTrade}
                style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: tradeType === "buy" ? "var(--green)" : "var(--red)", color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
              >
                {tradeType === "buy" ? `Buy ${tradeUnits} units →` : `Sell ${tradeUnits} units →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}