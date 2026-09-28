import { Router, type IRouter } from "express";
import {
  InMemoryAiTutorGuard,
  parsePositiveInteger,
  processTutorRequest,
  publicErrorBody,
  type TutorMessage,
  type ValidTutorRequest,
} from "../lib/aiTutorSecurity";
import { eventForSecurityCode, logApiEvent } from "../lib/apiObservability";

const router: IRouter = Router();

const guard = new InMemoryAiTutorGuard({
  rateWindowMs: parsePositiveInteger(process.env["AI_TUTOR_RATE_WINDOW_MS"], 60_000),
  rateMax: parsePositiveInteger(process.env["AI_TUTOR_RATE_MAX"], 10),
  installationDailyMax: parsePositiveInteger(process.env["AI_TUTOR_INSTALL_DAILY_MAX"], 15),
  globalDailyMax: parsePositiveInteger(process.env["AI_TUTOR_GLOBAL_DAILY_MAX"], 500),
  maxConcurrent: parsePositiveInteger(process.env["AI_TUTOR_MAX_CONCURRENT"], 10),
});

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const response = data as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };

  if (typeof response.output_text === "string") return response.output_text.trim();

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string")
    .join("\n")
    .trim();
}

export function buildPrompt({
  level,
  scenarioTitle,
  messages,
}: Pick<ValidTutorRequest, "level" | "scenarioTitle" | "messages">) {
  const conversation = messages
    .map((message: TutorMessage) =>
      `${message.role === "user" ? "Learner" : "Tutor"}: ${message.text}`,
    )
    .join("\n");

  return `You are a patient Polish tutor for English-speaking learners.

Current level: ${level}
Scenario: ${scenarioTitle}

Rules:
- Keep the reply short and friendly.
- Help the learner practise real Polish conversation.
- If the learner writes English, give a simple Polish phrase they can try.
- If the learner writes Polish, correct only the most important mistakes.
- Always include a short English explanation after the Polish phrase.
- Use this exact format:
  Polish: <one useful Polish sentence or reply>
  English: <plain English meaning or correction>
  Try next: <one short Polish question or prompt>
- For A1/A2, use very simple Polish. For B1/B2, use more natural Polish.
- Do not overwhelm the learner with long grammar tables.
- Do not reply only in Polish.

Conversation:
${conversation}

Reply as the tutor.`;
}

async function requestOpenAi(request: ValidTutorRequest, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    parsePositiveInteger(process.env["AI_TUTOR_OPENAI_TIMEOUT_MS"], 20_000),
  );

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env["OPENAI_MODEL"] || "gpt-5-mini",
        input: buildPrompt(request),
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        max_output_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw Object.assign(new Error("Provider request failed"), {
        name: "ProviderHttpError",
        providerStatus: response.status,
      });
    }

    const reply = extractOutputText(await response.json());
    if (!reply) throw Object.assign(new Error("Provider response was empty"), { name: "ProviderEmptyError" });
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/ai-tutor", async (req, res) => {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    logApiEvent(req, "error", "not_configured", { statusCode: 503 });
    res.status(503).json({
      error: { code: "AI_TUTOR_NOT_CONFIGURED", message: "AI tutor is unavailable." },
    });
    return;
  }

  try {
    const result = await processTutorRequest({
      body: req.body,
      installationId: req.get("x-ai-installation-id"),
      ip: req.ip || req.socket.remoteAddress || "unknown",
      guard,
      requestProvider: (request) => requestOpenAi(request, apiKey),
    });

    if (!result.ok) {
      logApiEvent(req, result.error.status >= 500 ? "warn" : "info", eventForSecurityCode(result.error.code), {
        statusCode: result.error.status,
      });
      res.status(result.error.status).json(publicErrorBody(result.error));
      return;
    }

    res.json({ reply: result.reply });
  } catch (err) {
    const providerStatus =
      err && typeof err === "object" && "providerStatus" in err
        ? (err as { providerStatus?: unknown }).providerStatus
        : undefined;
    const event =
      err instanceof Error && err.name === "AbortError"
        ? "provider_timeout"
        : err instanceof Error && err.name === "ProviderEmptyError"
          ? "provider_invalid_response"
          : err instanceof Error && err.name === "ProviderHttpError"
            ? "provider_http_error"
            : "internal_error";
    logApiEvent(req, "error", event, { statusCode: 502, error: err, providerStatus });
    res.status(502).json(
      publicErrorBody({ code: "AI_TUTOR_PROVIDER_ERROR", message: "AI tutor request failed." }),
    );
  }
});

export default router;
