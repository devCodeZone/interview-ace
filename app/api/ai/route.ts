import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM = `You are "Ace", an experienced technical interviewer and hiring manager for frontend / UI engineering roles at top product and service companies (FAANG, Indian unicorns, GCCs and consulting firms).
You calibrate questions and expectations to the candidate's years of experience exactly like a real panel would: a 10+ year candidate gets architecture, trade-offs, leadership and deep internals; a 2 year candidate gets fundamentals.
Be realistic, fair and specific. Never invent facts about the candidate. Always reply with valid JSON only when asked for JSON.`;

async function gemini(key: string, prompt: string, opts: { json?: boolean; search?: boolean; temperature?: number } = {}) {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      ...(opts.json && !opts.search ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.search) body.tools = [{ google_search: {} }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  const sources = (cand?.groundingMetadata?.groundingChunks ?? [])
    .map((c: { web?: { uri?: string; title?: string } }) => c.web)
    .filter(Boolean)
    .slice(0, 8);
  return { text, sources };
}

function parseJSON(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("Model did not return JSON");
}

export async function GET() {
  return NextResponse.json({ serverKey: Boolean(process.env.GEMINI_API_KEY), model: MODEL });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "NO_KEY" }, { status: 400 });
  const { action, payload } = await req.json();

  try {
    switch (action) {
      case "analyze": {
        const prompt = `Analyse this resume as an HR screener + hiring manager would before an interview.
Return JSON: {"name": string, "years": number (total professional years), "level": "junior"|"mid"|"senior"|"lead" (0-2,3-5,6-9,10+ years), "role": string (best-fit target role title), "skills": string[], "topics": string[] (choose from: JavaScript, TypeScript, React, Next.js, Angular, HTML & CSS, Performance, Browser & Web, Security, Testing, State Management, Frontend System Design, Accessibility, Adobe Target & Personalization, AI in Frontend, Behavioral / HR, Managerial / Leadership), "companies": string[] (employers mentioned), "projects": string[] (short), "summary": string (2 sentences, how a recruiter sees this profile), "focusAreas": string[] (what interviewers will probe hardest for this profile, 4-6 items), "likelyRounds": string[] (realistic interview rounds for this level)}
RESUME:
${String(payload.text).slice(0, 15000)}`;
        const { text } = await gemini(key, prompt, { json: true, temperature: 0.2 });
        return NextResponse.json({ ...parseJSON(text), analysedBy: "ai" });
      }

      case "plan": {
        const { config, profile, research } = payload;
        const prompt = `Create a realistic mock interview question plan.
Candidate profile: ${JSON.stringify(profile ?? {}).slice(0, 4000)}
Interview settings: mode=${config.mode}; level=${config.level}; target role=${config.role}; company=${config.company || "any"}; topics=${(config.topics || []).join(", ") || "infer from profile"}; rounds=${(config.rounds || []).join(", ")}.
${research ? `Recent market intel on questions being asked (use it): ${String(research).slice(0, 4000)}` : ""}
Produce exactly ${config.questionCount} spoken (non-coding) questions in the order a real panel would ask them: start with an introduction question if HR/resume mode, include questions about the candidate's actual projects/companies from the resume when available, then technical depth, system design (for senior+), managerial/leadership (for senior/lead) and HR/closing questions only for the selected rounds. Questions must match ${config.level} level depth and the company's known interview style if a company is given.
Return JSON array: [{"question": string, "topic": string, "kind": "theory"|"behavioral"|"design", "points": string[] (4-6 key points a strong answer must cover), "ideal": string (a model answer in 3-5 sentences)}]`;
        const { text } = await gemini(key, prompt, { json: true, temperature: 0.8 });
        const arr = parseJSON(text);
        return NextResponse.json({ questions: Array.isArray(arr) ? arr : arr.questions ?? [] });
      }

      case "research": {
        const { company, role, level, topics } = payload;
        const prompt = `Search the web for the most recent (last 12 months) interview experiences and questions for ${role || "Frontend Developer"} (${level} level) roles${company ? ` at ${company}` : ""}${topics?.length ? ` focusing on ${topics.join(", ")}` : ""}. Use sources like Glassdoor, LeetCode Discuss, AmbitionBox, Blind, GeeksforGeeks and Medium interview write-ups.
Then return ONLY JSON: {"rounds": string[] (interview rounds currently reported), "trends": string[] (3-6 notable trends), "questions": [{"question": string, "topic": string, "kind": "theory"|"behavioral"|"design", "points": string[]}] (10-15 questions that are actually being reported)}`;
        const { text, sources } = await gemini(key, prompt, { search: true, temperature: 0.3 });
        return NextResponse.json({ ...parseJSON(text), sources });
      }

      case "evaluate": {
        const { question, answer, level, code, tests, followUps } = payload;
        const prompt = `Evaluate the candidate's answer like a real interviewer for a ${level}-level frontend role.
QUESTION (${question.kind}, topic ${question.topic}): ${question.question}
${question.points?.length ? `Expected key points: ${question.points.join("; ")}` : ""}
${code ? `CANDIDATE CODE:\n${String(code).slice(0, 8000)}\n${tests ? `Automated tests passed: ${tests.passed}/${tests.total}` : "No automated tests (machine coding) — review the code yourself for correctness, structure, state handling, edge cases and accessibility."}` : ""}
CANDIDATE ANSWER (transcribed from speech, ignore minor transcription errors): ${String(answer || "(no spoken answer)").slice(0, 6000)}
Score strictly for the level (a 10-year candidate must show depth, trade-offs and real examples to score 8+).
Return JSON: {"score": number 0-10 (one decimal), "verdict": string (2-5 words), "strengths": string[], "gaps": string[], "ideal": string (model answer, 3-6 sentences)${followUps ? `, "followUp": string (one natural probing follow-up question an interviewer would ask next based on THIS answer, or "" if not needed)` : ""}}`;
        const { text } = await gemini(key, prompt, { json: true, temperature: 0.3 });
        return NextResponse.json({ ...parseJSON(text), by: "ai" });
      }

      case "report": {
        const { records, config, profile } = payload;
        const compact = (records as Array<{ question: { question: string; topic: string }; answer: string; evaluation?: { score: number } }>).map((r) => ({
          q: r.question.question, topic: r.question.topic, score: r.evaluation?.score, answer: String(r.answer || "").slice(0, 600),
        }));
        const prompt = `You are the hiring panel writing the final interview debrief.
Candidate: ${JSON.stringify(profile ?? {}).slice(0, 2000)}
Interview: level ${config.level}, role ${config.role}, company ${config.company || "general market"}, rounds ${(config.rounds || []).join(", ")}.
Per-question results: ${JSON.stringify(compact).slice(0, 12000)}
Return JSON: {"overall": number 0-10, "verdict": "Strong Hire"|"Hire"|"Borderline"|"Not Yet", "summary": string (3-4 sentences, honest: would this candidate be selected and why), "topicScores": [{"topic": string, "score": number}], "strengths": string[], "improvements": string[] (specific, actionable), "nextQuestions": string[] (6-8 questions the panel would most likely ask in the NEXT round given these answers), "studyPlan": string[] (5-7 day plan)}`;
        const { text } = await gemini(key, prompt, { json: true, temperature: 0.4 });
        return NextResponse.json({ ...parseJSON(text), by: "ai" });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
