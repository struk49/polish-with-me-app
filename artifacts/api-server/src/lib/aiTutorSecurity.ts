export const AI_TUTOR_LIMITS = {
  maxMessages: 8,
  maxMessageLength: 500,
  maxConversationLength: 3_000,
  installationIdMaxLength: 100,
} as const;

export type TutorLevel = "A1" | "A2" | "B1" | "B2";

export interface TutorMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ValidTutorRequest {
  level: TutorLevel;
  scenarioId: keyof typeof TRUSTED_SCENARIOS;
  scenarioTitle: string;
  messages: TutorMessage[];
}

export interface SecurityError {
  status: number;
  code: string;
  message: string;
}

export function publicErrorBody({ code, message }: Pick<SecurityError, "code" | "message">) {
  return { error: { code, message } };
}

export const TRUSTED_SCENARIOS = {
  "meet-someone": "Meet someone",
  coffee: "Order coffee",
  shop: "At the shop",
  directions: "Directions",
  family: "Family",
} as const;

const VALID_LEVELS = new Set<TutorLevel>(["A1", "A2", "B1", "B2"]);
const INSTALLATION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{15,99}$/;

function error(status: number, code: string, message: string): SecurityError {
  return { status, code, message };
}

function isTutorMessage(value: unknown): value is TutorMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate["role"] === "user" || candidate["role"] === "assistant") &&
    typeof candidate["text"] === "string" &&
    candidate["text"].trim().length > 0 &&
    candidate["text"].length <= AI_TUTOR_LIMITS.maxMessageLength
  );
}

export function validateInstallationId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= AI_TUTOR_LIMITS.installationIdMaxLength &&
    INSTALLATION_ID_PATTERN.test(value)
  );
}

export function validateTutorRequest(body: unknown):
  | { ok: true; value: ValidTutorRequest }
  | { ok: false; error: SecurityError } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: error(400, "INVALID_REQUEST", "Invalid request.") };
  }

  const candidate = body as Record<string, unknown>;
  const level = candidate["level"];
  const scenarioId = candidate["scenarioId"];
  const messages = candidate["messages"];

  if (typeof level !== "string" || !VALID_LEVELS.has(level as TutorLevel)) {
    return { ok: false, error: error(400, "INVALID_LEVEL", "Invalid level.") };
  }

  if (typeof scenarioId !== "string" || !(scenarioId in TRUSTED_SCENARIOS)) {
    return { ok: false, error: error(400, "INVALID_SCENARIO", "Invalid scenario.") };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: error(400, "INVALID_MESSAGES", "Invalid messages.") };
  }

  if (messages.length > AI_TUTOR_LIMITS.maxMessages) {
    return { ok: false, error: error(400, "TOO_MANY_MESSAGES", "Too many messages.") };
  }

  if (!messages.every(isTutorMessage)) {
    return { ok: false, error: error(400, "INVALID_MESSAGE", "Invalid message.") };
  }

  const totalLength = messages.reduce((sum, message) => sum + message.text.length, 0);
  if (totalLength > AI_TUTOR_LIMITS.maxConversationLength) {
    return { ok: false, error: error(400, "CONVERSATION_TOO_LARGE", "Conversation is too large.") };
  }

  const trustedScenarioId = scenarioId as keyof typeof TRUSTED_SCENARIOS;
  return {
    ok: true,
    value: {
      level: level as TutorLevel,
      scenarioId: trustedScenarioId,
      scenarioTitle: TRUSTED_SCENARIOS[trustedScenarioId],
      messages,
    },
  };
}

interface Counter {
  count: number;
  expiresAt: number;
}

export interface AbuseGuardOptions {
  rateWindowMs: number;
  rateMax: number;
  installationDailyMax: number;
  globalDailyMax: number;
  maxConcurrent: number;
  now?: () => number;
}

export class InMemoryAiTutorGuard {
  private readonly options: AbuseGuardOptions;
  private readonly rateCounters = new Map<string, Counter>();
  private readonly installationCounters = new Map<string, Counter>();
  private globalCounter?: Counter;
  private concurrent = 0;

  constructor(options: AbuseGuardOptions) {
    this.options = options;
  }

  acquire(ip: string, installationId: string):
    | { ok: true; release: () => void }
    | { ok: false; error: SecurityError } {
    const now = this.options.now?.() ?? Date.now();
    const rate = this.increment(this.rateCounters, ip, now, this.options.rateWindowMs);
    if (rate > this.options.rateMax) {
      return { ok: false, error: error(429, "RATE_LIMITED", "Too many requests. Please try again later.") };
    }

    if (this.concurrent >= this.options.maxConcurrent) {
      return { ok: false, error: error(503, "AI_TUTOR_BUSY", "AI tutor is busy. Please try again later.") };
    }

    const untilNextUtcDay = this.nextUtcDay(now) - now;
    const installationTotal = this.increment(
      this.installationCounters,
      installationId,
      now,
      untilNextUtcDay,
    );
    if (installationTotal > this.options.installationDailyMax) {
      return { ok: false, error: error(429, "DAILY_QUOTA_EXCEEDED", "Daily AI tutor limit reached.") };
    }

    this.globalCounter = this.incrementCounter(this.globalCounter, now, untilNextUtcDay);
    if (this.globalCounter.count > this.options.globalDailyMax) {
      return { ok: false, error: error(429, "GLOBAL_QUOTA_EXCEEDED", "AI tutor is unavailable for today.") };
    }

    this.concurrent += 1;
    let released = false;
    return {
      ok: true,
      release: () => {
        if (!released) {
          released = true;
          this.concurrent = Math.max(0, this.concurrent - 1);
        }
      },
    };
  }

  private increment(store: Map<string, Counter>, key: string, now: number, ttl: number) {
    const next = this.incrementCounter(store.get(key), now, ttl);
    store.set(key, next);
    return next.count;
  }

  private incrementCounter(current: Counter | undefined, now: number, ttl: number): Counter {
    if (!current || current.expiresAt <= now) {
      return { count: 1, expiresAt: now + ttl };
    }
    current.count += 1;
    return current;
  }

  private nextUtcDay(now: number) {
    const date = new Date(now);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  }
}

export function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export type TutorServiceResult =
  | { ok: true; reply: string }
  | { ok: false; error: SecurityError };

export async function processTutorRequest({
  body,
  installationId,
  ip,
  guard,
  requestProvider,
}: {
  body: unknown;
  installationId: unknown;
  ip: string;
  guard: InMemoryAiTutorGuard;
  requestProvider: (request: ValidTutorRequest) => Promise<string>;
}): Promise<TutorServiceResult> {
  if (!validateInstallationId(installationId)) {
    return {
      ok: false,
      error: error(400, "INVALID_INSTALLATION_ID", "Invalid installation identifier."),
    };
  }

  const validation = validateTutorRequest(body);
  if (!validation.ok) return validation;

  const permit = guard.acquire(ip, installationId);
  if (!permit.ok) return permit;

  try {
    const reply = (await requestProvider(validation.value)).trim();
    if (!reply) {
      return {
        ok: false,
        error: error(502, "EMPTY_PROVIDER_RESPONSE", "AI tutor returned an empty reply."),
      };
    }
    return { ok: true, reply };
  } finally {
    permit.release();
  }
}
