import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const sessions = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(body));
}

function safeParse(text) {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(withoutFence);
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

function nextCoreQuestion(session) {
  const remaining = session.questionPool.filter((q) => !session.usedCoreIds.has(q.id));
  const picked = pickRandom(remaining);
  if (!picked) return null;
  session.usedCoreIds.add(picked.id);
  session.currentCoreQuestion = picked;
  session.currentFollowUps = 0;
  session.coreAsked += 1;
  return {
    id: `${picked.id}:core:${session.coreAsked}`,
    category: picked.category,
    prompt: picked.prompt,
    timeLimitSec: picked.timeLimitSec,
    isFollowUp: false,
    coreIndex: session.coreAsked,
    totalCoreQuestions: session.targetCoreQuestions
  };
}

async function callGeminiJson(instruction, payload, fallback) {
  if (!GEMINI_API_KEY) return fallback;

  const prompt = `${instruction}\nReturn strict JSON only.\nInput:\n${JSON.stringify(payload)}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) return fallback;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return fallback;

  try {
    return safeParse(text);
  } catch {
    return fallback;
  }
}

async function handleStart(req, res) {
  const body = await readBody(req);
  const interviewType = body.interviewType;
  const questionPool = Array.isArray(body.questionPool) ? body.questionPool : [];
  const targetCoreQuestions = Number(body.targetCoreQuestions ?? 5);
  const maxFollowUpsPerCore = Number(body.maxFollowUpsPerCore ?? 1);

  if (!interviewType || questionPool.length === 0) {
    json(res, 400, { error: "interviewType and questionPool are required" });
    return;
  }

  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    interviewType,
    questionPool,
    targetCoreQuestions: Math.max(1, Math.min(targetCoreQuestions, questionPool.length)),
    maxFollowUpsPerCore: Math.max(0, maxFollowUpsPerCore),
    usedCoreIds: new Set(),
    coreAsked: 0,
    currentCoreQuestion: null,
    currentFollowUps: 0,
    turns: []
  };

  const firstQuestion = nextCoreQuestion(session);
  if (!firstQuestion) {
    json(res, 500, { error: "Failed to choose first question" });
    return;
  }

  sessions.set(sessionId, session);
  json(res, 200, { sessionId, question: firstQuestion });
}

async function handleTurn(req, res) {
  const body = await readBody(req);
  const session = sessions.get(body.sessionId);
  if (!session) {
    json(res, 404, { error: "Session not found" });
    return;
  }

  const answerText = String(body.answerText ?? "").trim();
  const currentCore = session.currentCoreQuestion;
  if (!currentCore) {
    json(res, 500, { error: "Invalid session state" });
    return;
  }

  session.turns.push({
    questionId: `${currentCore.id}:turn:${session.turns.length + 1}`,
    questionText: currentCore.prompt,
    category: currentCore.category,
    isFollowUp: session.currentFollowUps > 0,
    answerText,
    answeredAt: new Date().toISOString()
  });

  if (session.coreAsked >= session.targetCoreQuestions && session.currentFollowUps >= session.maxFollowUpsPerCore) {
    json(res, 200, { done: true, question: null });
    return;
  }

  const canFollowUp = session.currentFollowUps < session.maxFollowUpsPerCore;
  const hasMoreCore = session.coreAsked < session.targetCoreQuestions;

  const fallbackDecision = canFollowUp && answerText.length < 24
    ? {
        action: "follow_up",
        question: {
          category: currentCore.category,
          prompt: `Please add more detail with one concrete example for: ${currentCore.prompt}`,
          timeLimitSec: Math.max(75, Math.floor(currentCore.timeLimitSec * 0.7))
        }
      }
    : { action: hasMoreCore ? "next_core" : "end" };

  const decision = await callGeminiJson(
    "You are an interviewer router. Decide the next interview action with JSON: {action:'follow_up'|'next_core'|'end', question?:{category,prompt,timeLimitSec}}. Use follow_up only when answer is weak/incomplete and follow-up budget allows.",
    {
      interviewType: session.interviewType,
      answerText,
      canFollowUp,
      hasMoreCore,
      currentCoreQuestion: currentCore,
      askedTurns: session.turns
    },
    fallbackDecision
  );

  const action = decision?.action;
  if (action === "follow_up" && canFollowUp && decision?.question?.prompt) {
    session.currentFollowUps += 1;
    json(res, 200, {
      done: false,
      question: {
        id: `${currentCore.id}:follow:${session.currentFollowUps}`,
        category: String(decision.question.category ?? currentCore.category),
        prompt: String(decision.question.prompt),
        timeLimitSec: Number(decision.question.timeLimitSec ?? Math.max(75, Math.floor(currentCore.timeLimitSec * 0.7))),
        isFollowUp: true,
        coreIndex: session.coreAsked,
        totalCoreQuestions: session.targetCoreQuestions
      }
    });
    return;
  }

  if (!hasMoreCore) {
    json(res, 200, { done: true, question: null });
    return;
  }

  const coreQuestion = nextCoreQuestion(session);
  if (!coreQuestion) {
    json(res, 200, { done: true, question: null });
    return;
  }

  json(res, 200, {
    done: false,
    question: coreQuestion
  });
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function heuristicReport(turns) {
  const base = clamp(68 + turns.length * 3);
  const speech = clamp(base - 4);
  const content = clamp(base + 2);
  const bodyLanguage = clamp(base - 1);
  const questionScores = turns.map((turn, idx) => {
    const answerLen = turn.answerText?.length ?? 0;
    const contentScore = clamp(55 + Math.min(answerLen / 5, 35));
    const speechScore = clamp(62 + Math.min(answerLen / 8, 25));
    const bodyLanguageScore = clamp(65 + Math.min(answerLen / 10, 20));
    return {
      questionId: turn.questionId || `q${idx + 1}`,
      questionText: turn.questionText,
      speechScore,
      contentScore,
      bodyLanguageScore,
      overall: Math.round((speechScore + contentScore + bodyLanguageScore) / 3)
    };
  });

  const overallScore = Math.round((speech + content + bodyLanguage) / 3);
  const grade = overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F";

  return {
    overallScore,
    grade,
    categoryBreakdown: {
      speech,
      content,
      bodyLanguage
    },
    questionScores,
    strengths: ["Maintained interview flow and responded to prompts."],
    improvements: ["Add more concrete examples and measurable outcomes in answers."]
  };
}

async function handleFinalize(req, res) {
  const body = await readBody(req);
  const session = sessions.get(body.sessionId);
  if (!session) {
    json(res, 404, { error: "Session not found" });
    return;
  }

  const fallbackReport = heuristicReport(session.turns);
  const aiResult = await callGeminiJson(
    "You are an interview evaluator. Return strict JSON with keys: report and summary. report must include overallScore (0-100), grade (A/B/C/D/F), categoryBreakdown {speech,content,bodyLanguage}, questionScores [{questionId,questionText,speechScore,contentScore,bodyLanguageScore,overall}], strengths string[], improvements string[].",
    {
      interviewType: session.interviewType,
      turns: session.turns
    },
    {
      report: fallbackReport,
      summary: "Feedback generated from deterministic fallback evaluator."
    }
  );

  const report = aiResult?.report ?? fallbackReport;
  const summary = typeof aiResult?.summary === "string" ? aiResult.summary : "Interview analysis complete.";

  json(res, 200, { report, summary, transcript: session.turns });
  sessions.delete(session.sessionId);
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    json(res, 404, { error: "Not found" });
    return;
  }

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/api/health") {
      json(res, 200, { ok: true, model: GEMINI_MODEL, geminiConfigured: Boolean(GEMINI_API_KEY) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/interview/session/start") {
      await handleStart(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/interview/session/turn") {
      await handleTurn(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/interview/session/finalize") {
      await handleFinalize(req, res);
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    json(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`[ai-server] listening on http://localhost:${PORT}`);
});
