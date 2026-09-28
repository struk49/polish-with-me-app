import type { ErrorRequestHandler, Request } from "express";

export type ApiEvent =
  | "validation_rejected"
  | "rate_limited"
  | "installation_quota"
  | "global_quota"
  | "concurrency_limited"
  | "not_configured"
  | "provider_timeout"
  | "provider_http_error"
  | "provider_invalid_response"
  | "internal_error";

function errorClass(error: unknown) {
  return error instanceof Error && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(error.name)
    ? error.name
    : "UnknownError";
}

function sanitizedStack(error: unknown) {
  if (!(error instanceof Error) || typeof error.stack !== "string") return undefined;
  const frames = error.stack.split("\n").slice(1, 21).filter((line) => /^\s*at\s/.test(line));
  return frames.length ? frames.map((line) => line.slice(0, 300)).join("\n") : undefined;
}

export function eventForSecurityCode(code: string): ApiEvent {
  if (code === "RATE_LIMITED") return "rate_limited";
  if (code === "DAILY_QUOTA_EXCEEDED") return "installation_quota";
  if (code === "GLOBAL_QUOTA_EXCEEDED") return "global_quota";
  if (code === "AI_TUTOR_BUSY") return "concurrency_limited";
  return "validation_rejected";
}

export function createApiEvent(event: ApiEvent, options: {
  requestId?: unknown;
  statusCode: number;
  error?: unknown;
  providerStatus?: unknown;
}) {
  return {
    event,
    statusCode: options.statusCode,
    ...(typeof options.requestId === "string" ? { requestId: options.requestId.slice(0, 100) } : {}),
    ...(options.error ? { errorClass: errorClass(options.error), stack: sanitizedStack(options.error) } : {}),
    ...(typeof options.providerStatus === "number" ? { providerStatus: options.providerStatus } : {}),
  };
}

export function logApiEvent(req: Request, level: "info" | "warn" | "error", event: ApiEvent, options: {
  statusCode: number;
  error?: unknown;
  providerStatus?: unknown;
}) {
  req.log?.[level]?.(
    createApiEvent(event, { requestId: req.id, ...options }),
    `api_event:${event}`,
  );
}

export const unexpectedErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  logApiEvent(req, "error", "internal_error", { statusCode: 500, error });
  res.status(500).json({ error: "INTERNAL_ERROR" });
};

export function fatalProcessEvent(event: "unhandled_rejection" | "uncaught_exception", error: unknown) {
  return {
    event,
    errorClass: errorClass(error),
    stack: sanitizedStack(error),
  };
}
