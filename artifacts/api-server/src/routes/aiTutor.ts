import { Router, type IRouter } from "express";

type TutorLevel = "A1" | "A2" | "B1" | "B2";

interface TutorMessage {
  role: "user" | "assistant";
  text: string;
}

const router: IRouter = Router();

const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2"]);

function logRouteError(req: unknown, details: unknown, message: string) {
  const requestWithLogger = req as {
    log?: { error?: (details: unknown, message?: string) => void };
  };
  requestWithLogger.log?.error?.(details, message);
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const response = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string")
    .join("\n")
    .trim();
}

function isTutorMessage(value: unknown): value is TutorMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate["role"] === "user" || candidate["role"] === "assistant") &&
    typeof candidate["text"] === "string" &&
    candidate["text"].trim().length > 0 &&
    candidate["text"].length <= 600
  );
}

function buildPrompt({
  level,
  scenarioTitle,
  messages,
}: {
  level: TutorLevel;
  scenarioTitle: string;
  messages: TutorMessage[];
}) {
  const conversation = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "Learner" : "Tutor"}: ${message.text}`)
    .join("\n");

  return `You are a patient Polish tutor for English-speaking learners.

Current level: ${level}
Scenario: ${scenarioTitle}

Rules:
- Keep the reply short and friendly.
- Help the learner practise real Polish conversation.
- If the learner writes English, give a simple Polish phrase they can try.
- If the learner writes Polish, correct only the most important mistakes.
- Explain corrections in English.
- For A1/A2, use very simple Polish. For B1/B2, use more natural Polish.
- Do not overwhelm the learner with long grammar tables.
- End with one short Polish question or prompt to continue.

Conversation:
${conversation}

Reply as the tutor.`;
}

router.post("/ai-tutor", async (req, res) => {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({
      error: "AI tutor is not configured on the server.",
    });
    return;
  }

  const level = req.body?.level;
  const scenarioTitle = req.body?.scenarioTitle;
  const messages = req.body?.messages;

  if (!VALID_LEVELS.has(level)) {
    res.status(400).json({ error: "Invalid level." });
    return;
  }

  if (typeof scenarioTitle !== "string" || scenarioTitle.length > 80) {
    res.status(400).json({ error: "Invalid scenario." });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12 || !messages.every(isTutorMessage)) {
    res.status(400).json({ error: "Invalid messages." });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env["OPENAI_MODEL"] || "gpt-5-mini",
        input: buildPrompt({
          level,
          scenarioTitle,
          messages,
        }),
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        max_output_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logRouteError(req, { status: response.status, errorText }, "OpenAI request failed");
      res.status(502).json({ error: "AI tutor request failed." });
      return;
    }

    const data = await response.json();
    const reply = extractOutputText(data);

    if (!reply) {
      res.status(502).json({ error: "AI tutor returned an empty reply." });
      return;
    }

    res.json({ reply });
  } catch (err) {
    logRouteError(req, { err }, "AI tutor route failed");
    res.status(500).json({ error: "AI tutor server error." });
  }
});

export default router;
