const API_BASE = "http://localhost:8000";

export const api = {
  // Auth
  signup: (data: object) =>
    fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  login: (data: object) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  // Goals
  getGoals: (token: string) =>
    fetch(`${API_BASE}/goals`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),

  createGoal: (token: string, data: object) =>
    fetch(`${API_BASE}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  contributeToGoal: (token: string, goalId: number, amount: number) =>
    fetch(`${API_BASE}/goals/${goalId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    }).then((r) => r.json()),

  getGoalsSummary: (token: string) =>
    fetch(`${API_BASE}/goals/stats/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),

  // Learn
  getTracks: () =>
    fetch(`${API_BASE}/learn/tracks`).then((r) => r.json()),

  getTrack: (id: number) =>
    fetch(`${API_BASE}/learn/tracks/${id}`).then((r) => r.json()),

  completeLesson: (token: string, lessonId: number) =>
    fetch(`${API_BASE}/learn/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: 1 }),
    }).then((r) => r.json()),

  // Invest
  getFunds: () =>
    fetch(`${API_BASE}/invest/funds`).then((r) => r.json()),

  getVirtualPortfolio: (token: string) =>
    fetch(`${API_BASE}/invest/virtual/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),

  sipCalculator: (monthly: number, years: number, rate: number) =>
    fetch(`${API_BASE}/sip-calculator?monthly_amount=${monthly}&years=${years}&annual_return_percent=${rate}`)
      .then((r) => r.json()),
};