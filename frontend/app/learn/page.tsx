"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

interface Track {
  id: number;
  title: string;
  icon: string;
  category: string;
  difficulty: string;
  total_xp: number;
  lesson_count: number;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  order_number: number;
  duration_minutes: number;
  xp_reward: number;
  questions: Question[];
}

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  xp_reward: number;
}

interface QuizResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  xp_earned: number;
}

export default function LearnPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"tracks" | "lessons" | "lesson" | "quiz">("tracks");
  const [xpEarned, setXpEarned] = useState(0);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/auth"); return; }
    setToken(t);
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const res = await fetch(`${API}/learn/tracks`);
      if (res.ok) setTracks(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openTrack = async (track: Track) => {
    const res = await fetch(`${API}/learn/tracks/${track.id}`);
    const data = await res.json();
    setSelectedTrack(data);
    setView("lessons");
  };

  const openLesson = async (lesson: Lesson) => {
    const res = await fetch(`${API}/learn/lessons/${lesson.id}`);
    const data = await res.json();
    setSelectedLesson(data);
    setView("lesson");
  };

  const completeLesson = async () => {
    if (!selectedLesson) return;
    await fetch(`${API}/learn/lessons/${selectedLesson.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: 1 }),
    });
    setXpEarned((prev) => prev + selectedLesson.xp_reward);
    if (selectedLesson.questions?.length > 0) {
      setCurrentQ(0);
      setSelected("");
      setResult(null);
      setAnswered(false);
      setQuizDone(false);
      setView("quiz");
    } else {
      setView("lessons");
    }
  };

  const submitAnswer = async () => {
    if (!selected || !selectedLesson) return;
    const question = selectedLesson.questions[currentQ];
    const res = await fetch(`${API}/learn/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: question.id, selected_option: selected }),
    });
    const data = await res.json();
    setResult(data);
    setAnswered(true);
    if (data.xp_earned > 0) setXpEarned((prev) => prev + data.xp_earned);
  };

  const nextQuestion = () => {
    if (!selectedLesson) return;
    if (currentQ < selectedLesson.questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelected("");
      setResult(null);
      setAnswered(false);
    } else {
      setQuizDone(true);
    }
  };

  const difficultyColor = (d: string) => {
    if (d === "beginner") return { bg: "var(--green2)", color: "var(--green)" };
    if (d === "intermediate") return { bg: "var(--gold3)", color: "var(--gold)" };
    return { bg: "var(--red2)", color: "var(--red)" };
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontFamily: "DM Sans, sans-serif" }}>Loading courses...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "DM Sans, sans-serif" }}>

      {/* Nav */}
      <div style={{ background: "var(--navy)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          onClick={() => { if (view === "tracks") router.push("/dashboard"); else if (view === "lessons") setView("tracks"); else if (view === "lesson") setView("lessons"); else setView("lessons"); }}
          style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white", cursor: "pointer" }}
        >
          ← {view === "tracks" ? "Niveshak360" : view === "lessons" ? "Courses" : view === "lesson" ? selectedTrack?.title : "Lesson"}
        </span>
        {xpEarned > 0 && (
          <span style={{ fontSize: 13, background: "rgba(201,168,76,0.2)", color: "var(--gold2)", padding: "5px 12px", borderRadius: 10, border: "1px solid rgba(201,168,76,0.3)" }}>
            +{xpEarned} XP earned 🏆
          </span>
        )}
      </div>

      {/* ── TRACKS VIEW ── */}
      {view === "tracks" && (
        <div style={{ padding: "24px 28px", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: "var(--navy)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
            <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 26, color: "white", marginBottom: 4 }}>
              Learn
            </h1>
            <p style={{ fontSize: 13, color: "var(--slate2)" }}>
              Build your financial knowledge, one lesson at a time
            </p>
          </div>

          {tracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>📚</p>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "var(--navy)", marginBottom: 8 }}>
                No courses yet
              </h2>
              <p style={{ fontSize: 14, color: "var(--slate)", marginBottom: 8 }}>
                Courses will appear here once they are added via the API.
              </p>
              <p style={{ fontSize: 12, color: "var(--slate2)" }}>
                Go to <strong>localhost:8000/docs</strong> → POST /learn/tracks to create your first course.
              </p>
            </div>
          ) : (
            tracks.map((track) => {
              const dc = difficultyColor(track.difficulty);
              return (
                <div
                  key={track.id}
                  onClick={() => openTrack(track)}
                  style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 20, marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.2s" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--slate4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {track.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{track.title}</p>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: dc.bg, color: dc.color, fontWeight: 500 }}>
                        {track.difficulty}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--slate)" }}>
                      {track.lesson_count} lessons · {track.total_xp} XP · {track.category}
                    </p>
                  </div>
                  <span style={{ fontSize: 20, color: "var(--slate3)" }}>→</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── LESSONS VIEW ── */}
      {view === "lessons" && selectedTrack && (
        <div style={{ padding: "24px 28px", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: "var(--navy)", borderRadius: 16, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              {selectedTrack.icon}
            </div>
            <div>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "white", marginBottom: 2 }}>{selectedTrack.title}</h2>
              <p style={{ fontSize: 12, color: "var(--slate2)" }}>
                {selectedTrack.lessons?.length || 0} lessons · {selectedTrack.total_xp} XP total
              </p>
            </div>
          </div>

          {selectedTrack.lessons?.map((lesson: Lesson, idx: number) => (
            <div
              key={lesson.id}
              onClick={() => openLesson(lesson)}
              style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 14, padding: "16px 20px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "white", flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{lesson.title}</p>
                <p style={{ fontSize: 11, color: "var(--slate)" }}>{lesson.duration_minutes} min · +{lesson.xp_reward} XP · {lesson.questions?.length || 0} quiz questions</p>
              </div>
              <span style={{ fontSize: 18, color: "var(--slate3)" }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* ── LESSON VIEW ── */}
      {view === "lesson" && selectedLesson && (
        <div style={{ padding: "24px 28px", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 16, padding: 28, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, background: "var(--purple2)", color: "var(--purple)", padding: "3px 10px", borderRadius: 8, fontWeight: 500 }}>
                Lesson {selectedLesson.order_number}
              </span>
              <span style={{ fontSize: 11, color: "var(--slate)" }}>
                {selectedLesson.duration_minutes} min · +{selectedLesson.xp_reward} XP
              </span>
            </div>

            <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: "var(--navy)", marginBottom: 16, lineHeight: 1.3 }}>
              {selectedLesson.title}
            </h1>

            {selectedLesson.content ? (
              <div style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.8 }}>
                {selectedLesson.content.split("\n").map((para, i) => (
                  <p key={i} style={{ marginBottom: 12 }}>{para}</p>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--slate4)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--slate)" }}>Lesson content will appear here.</p>
              </div>
            )}
          </div>

          <button
            onClick={completeLesson}
            style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "var(--gold)", color: "var(--navy)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
          >
            {selectedLesson.questions?.length > 0 ? "Complete & take quiz →" : "Mark as complete →"}
          </button>
        </div>
      )}

      {/* ── QUIZ VIEW ── */}
      {view === "quiz" && selectedLesson && (
        <div style={{ padding: "24px 28px", maxWidth: 600, margin: "0 auto" }}>

          {quizDone ? (
            <div style={{ background: "white", border: "1px solid var(--slate3)", borderRadius: 20, padding: 32, textAlign: "center" }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: "var(--navy)", marginBottom: 8 }}>
                Lesson complete!
              </h2>
              <p style={{ fontSize: 14, color: "var(--slate)", marginBottom: 20 }}>
                You earned <strong style={{ color: "var(--gold)" }}>+{xpEarned} XP</strong> in this session
              </p>
              <button
                onClick={() => setView("lessons")}
                style={{ background: "var(--navy)", color: "white", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
              >
                Back to lessons →
              </button>
            </div>
          ) : (
            <div>
              {/* Progress */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {selectedLesson.questions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= currentQ ? "var(--gold)" : "var(--slate4)" }} />
                ))}
              </div>

              <div style={{ background: "var(--navy)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "var(--slate2)", marginBottom: 8 }}>
                  Question {currentQ + 1} of {selectedLesson.questions.length}
                </p>
                <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "white", lineHeight: 1.4 }}>
                  {selectedLesson.questions[currentQ].question}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {(["a", "b", "c", "d"] as const).map((opt) => {
                  const text = selectedLesson.questions[currentQ][`option_${opt}`];
                  if (!text) return null;
                  const isSelected = selected === opt;
                  const isCorrect = answered && result?.correct_option === opt;
                  const isWrong = answered && isSelected && !result?.is_correct;
                  return (
                    <button
                      key={opt}
                      onClick={() => !answered && setSelected(opt)}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        border: `1.5px solid ${isCorrect ? "var(--green)" : isWrong ? "var(--red)" : isSelected ? "var(--navy)" : "var(--slate3)"}`,
                        background: isCorrect ? "var(--green2)" : isWrong ? "var(--red2)" : isSelected ? "var(--slate4)" : "white",
                        textAlign: "left",
                        fontSize: 13,
                        color: "var(--navy)",
                        cursor: answered ? "default" : "pointer",
                        fontFamily: "DM Sans, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid var(--slate3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, background: isSelected ? "var(--navy)" : "transparent", color: isSelected ? "white" : "var(--slate)", borderColor: isSelected ? "var(--navy)" : "var(--slate3)" }}>
                        {opt.toUpperCase()}
                      </span>
                      {text}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {result && (
                <div style={{ background: result.is_correct ? "var(--green2)" : "var(--red2)", border: `1px solid ${result.is_correct ? "var(--green)" : "var(--red)"}`, borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: result.is_correct ? "var(--green)" : "var(--red)", marginBottom: 4 }}>
                    {result.is_correct ? `✅ Correct! +${result.xp_earned} XP` : "❌ Not quite"}
                  </p>
                  {result.explanation && (
                    <p style={{ fontSize: 12, color: "var(--navy)", lineHeight: 1.5 }}>{result.explanation}</p>
                  )}
                </div>
              )}

              {/* Action button */}
              {!answered ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selected}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: selected ? "var(--navy)" : "var(--slate3)", color: selected ? "white" : "var(--slate)", fontSize: 14, fontWeight: 500, cursor: selected ? "pointer" : "not-allowed", fontFamily: "DM Sans, sans-serif" }}
                >
                  Confirm answer
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "var(--gold)", color: "var(--navy)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  {currentQ < selectedLesson.questions.length - 1 ? "Next question →" : "See results →"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}