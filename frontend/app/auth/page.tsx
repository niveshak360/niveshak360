"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState("college");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const url = mode === "signup"
        ? `${API}/auth/signup`
        : `${API}/auth/login`;

      const body = mode === "signup"
        ? { full_name: fullName, email, phone, password, age_group: ageGroup }
        : { email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong");
        setLoading(false);
        return;
      }

      // Save token and user to localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to dashboard
      router.push("/dashboard");

    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--navy)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: "var(--gold)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 16 16">
                <path d="M8 1 L14 8 L8 15 L2 8 Z" fill="white" />
              </svg>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: "white" }}>
              Niveshak360
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--slate2)" }}>
            {mode === "signup" ? "Create your free account" : "Welcome back"}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 20, padding: 32 }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", background: "var(--slate4)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                  background: mode === m ? "var(--navy)" : "transparent",
                  color: mode === m ? "white" : "var(--slate)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {m === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          {/* Signup fields */}
          {mode === "signup" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Aryan Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
                  Phone number
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
                  I am a
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { val: "school", label: "🎒 School student" },
                    { val: "college", label: "🎓 College student" },
                    { val: "professional", label: "💼 Professional" },
                    { val: "family", label: "🏠 Family" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setAgeGroup(opt.val)}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                        border: `1.5px solid ${ageGroup === opt.val ? "var(--navy)" : "var(--slate3)"}`,
                        background: ageGroup === opt.val ? "var(--navy)" : "transparent",
                        color: ageGroup === opt.val ? "white" : "var(--navy)",
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email - shown for both */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="aryan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Password - shown for both */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder={mode === "signup" ? "Minimum 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "var(--red2)", border: "1px solid #F09595",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            }}>
              <p style={{ fontSize: 12, color: "var(--red)" }}>{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: loading ? "var(--slate3)" : "var(--gold)",
              color: loading ? "var(--slate)" : "var(--navy)",
              fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create my account →"
              : "Log in →"}
          </button>

          {/* Terms */}
          {mode === "signup" && (
            <p style={{ fontSize: 11, color: "var(--slate)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
              By signing up you agree to our Terms of Service and Privacy Policy. No credit card required.
            </p>
          )}
        </div>

        {/* Back to home */}
        <p
          onClick={() => router.push("/")}
          style={{ textAlign: "center", fontSize: 12, color: "var(--slate2)", marginTop: 20, cursor: "pointer" }}
        >
          ← Back to home
        </p>

      </div>
    </div>
  );
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid var(--slate3)",
  fontSize: 13,
  color: "var(--navy)",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  background: "white",
};