import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureOperationalError } from "@/lib/observability";

export type AiLevel = "A1" | "A2" | "B1" | "B2";

export interface AiScenario {
  id: string;
  title: string;
  description: string;
  opener: string;
  starterReply: string;
}

export interface AiTutorMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export const AI_LEVELS: { id: AiLevel; label: string; description: string }[] = [
  { id: "A1", label: "A1", description: "Short, simple Polish with English help" },
  { id: "A2", label: "A2", description: "Everyday sentences and gentle correction" },
  { id: "B1", label: "B1", description: "Longer replies and natural phrasing" },
  { id: "B2", label: "B2", description: "More fluent conversation practice" },
];

export const AI_SCENARIOS: AiScenario[] = [
  {
    id: "meet-someone",
    title: "Meet someone",
    description: "Say hello, introduce yourself and answer simple questions.",
    opener: "Cześć! Jak masz na imię?",
    starterReply: "Try answering: Mam na imię Andrew.",
  },
  {
    id: "coffee",
    title: "Order coffee",
    description: "Practise ordering politely in a café.",
    opener: "Dzień dobry. Co podać?",
    starterReply: "Try: Poproszę kawę z mlekiem.",
  },
  {
    id: "shop",
    title: "At the shop",
    description: "Ask prices and buy everyday items.",
    opener: "Dzień dobry. W czym mogę pomóc?",
    starterReply: "Try: Ile to kosztuje?",
  },
  {
    id: "directions",
    title: "Directions",
    description: "Ask where something is and understand a simple answer.",
    opener: "Dokąd chcesz iść?",
    starterReply: "Try: Gdzie jest dworzec?",
  },
  {
    id: "family",
    title: "Family",
    description: "Talk about family and everyday life.",
    opener: "Opowiedz mi o swojej rodzinie.",
    starterReply: "Try: Mam żonę i dwoje dzieci.",
  },
];

export const AI_FREE_DAILY_LIMIT = 3;
export const AI_PRO_DAILY_LIMIT = 15;

const AI_INSTALLATION_ID_KEY = "aiTutorInstallationId";

function createInstallationId() {
  const randomPart = Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 10),
  ).join("");
  return `install-${Date.now().toString(36)}-${randomPart}`;
}

export async function getAiInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(AI_INSTALLATION_ID_KEY);
  if (existing) return existing;

  const created = createInstallationId();
  await AsyncStorage.setItem(AI_INSTALLATION_ID_KEY, created);
  return created;
}

const usageKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `aiTutorUsage:${year}-${month}-${day}`;
};

export async function getAiUsage(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(usageKey());
    return Number(raw ?? "0") || 0;
  } catch (error) {
    captureOperationalError({ category: "STORAGE_READ_FAILURE", operation: "storage", storage: "ai_usage", error });
    throw error;
  }
}

export async function incrementAiUsage(): Promise<number> {
  const next = (await getAiUsage()) + 1;
  try {
    await AsyncStorage.setItem(usageKey(), `${next}`);
  } catch (error) {
    captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "ai_usage", error });
    throw error;
  }
  return next;
}

export function getAiDailyLimit(isPremium: boolean): number {
  return isPremium ? AI_PRO_DAILY_LIMIT : AI_FREE_DAILY_LIMIT;
}

export function makeLocalTutorReply({
  userText,
  level,
  scenario,
}: {
  userText: string;
  level: AiLevel;
  scenario: AiScenario;
}) {
  const clean = userText.trim();
  const lower = clean.toLowerCase();

  if (!clean) {
    return `${scenario.opener}\n\n${scenario.starterReply}`;
  }

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Good start. In Polish, try: Cześć.\n\nNow answer in Polish if you can. Keep it simple — even one short sentence is fine.";
  }

  if (lower.includes("thank")) {
    return "In Polish, “thank you” is: Dziękuję.\n\nYou can also say: Dziękuję bardzo — thank you very much.";
  }

  if (lower.includes("coffee") || lower.includes("kawa")) {
    return "Nice café practice. A natural sentence is:\n\nPoproszę kawę z mlekiem.\n\nThat means: A coffee with milk, please.";
  }

  if (/[ąćęłńóśźż]/i.test(clean) || /\b(cześć|dzień|dobry|mam|jestem|proszę|dziękuję)\b/i.test(clean)) {
    return `Good — you are trying Polish. For ${level}, keep sentences short and clear.\n\nA more natural practice reply could be:\n${scenario.starterReply.replace("Try answering: ", "").replace("Try: ", "")}\n\nNext, try adding one more detail.`;
  }

  return `I can help you practise this scenario: ${scenario.title}.\n\nTry writing one short Polish sentence. If you are stuck, start with:\n${scenario.starterReply.replace("Try answering: ", "").replace("Try: ", "")}`;
}

export async function askAiTutor({
  endpoint,
  level,
  scenario,
  messages,
}: {
  endpoint?: string;
  level: AiLevel;
  scenario: AiScenario;
  messages: AiTutorMessage[];
}) {
  if (!endpoint) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      text: makeLocalTutorReply({
        userText: lastUser?.text ?? "",
        level,
        scenario,
      }),
      source: "local" as const,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const installationId = await getAiInstallationId();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Installation-ID": installationId,
      },
      body: JSON.stringify({
        level,
        scenarioId: scenario.id,
        messages: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error("AI tutor request failed");
      if (response.status >= 500 && response.status !== 503) {
        captureOperationalError({ category: "AI_PROVIDER_FAILURE", operation: "ai_network", error, httpStatus: response.status });
      }
      throw error;
    }

    const data = await response.json();
    if (!data?.reply || typeof data.reply !== "string") {
      const error = new Error("AI tutor response was invalid");
      captureOperationalError({ category: "AI_INVALID_RESPONSE", operation: "ai_network", error });
      throw error;
    }

    return { text: data.reply.trim(), source: "remote" as const };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      captureOperationalError({ category: "AI_TIMEOUT", operation: "ai_network", error });
    } else if (error instanceof TypeError) {
      captureOperationalError({ category: "AI_NETWORK_FAILURE", operation: "ai_network", error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
