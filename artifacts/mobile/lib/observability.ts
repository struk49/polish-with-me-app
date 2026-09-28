export type MobileErrorCategory =
  | "CRASH_UNCAUGHT_ERROR"
  | "BILLING_CONFIGURATION_FAILURE"
  | "BILLING_OFFERINGS_FAILURE"
  | "BILLING_PACKAGE_MISSING"
  | "BILLING_PURCHASE_FAILURE"
  | "BILLING_RESTORE_FAILURE"
  | "ENTITLEMENT_REFRESH_FAILURE"
  | "STORAGE_READ_FAILURE"
  | "STORAGE_WRITE_FAILURE"
  | "STORAGE_PARSE_FAILURE"
  | "AI_NETWORK_FAILURE"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_FAILURE"
  | "AI_INVALID_RESPONSE"
  | "STARTUP_FAILURE";

export type OperationCategory =
  | "billing"
  | "entitlement"
  | "storage"
  | "ai_network"
  | "startup"
  | "rendering";

export type StorageCategory = "progress" | "theme" | "ai_usage";

type ReporterEvent = {
  user?: unknown;
  request?: unknown;
  breadcrumbs?: unknown;
  extra?: unknown;
  tags?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  message?: string;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      stacktrace?: unknown;
      [key: string]: unknown;
    }>;
  };
  [key: string]: unknown;
};

type ReporterAdapter = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => unknown;
  captureMessage: (message: string, context?: Record<string, unknown>) => unknown;
};

type OperationalError = {
  category: MobileErrorCategory;
  operation: OperationCategory;
  error?: unknown;
  storage?: StorageCategory;
  httpStatus?: number;
  componentStack?: string;
};

let reporter: ReporterAdapter | null = null;
let initialized = false;

const ERROR_CATEGORIES = new Set<MobileErrorCategory>([
  "CRASH_UNCAUGHT_ERROR", "BILLING_CONFIGURATION_FAILURE", "BILLING_OFFERINGS_FAILURE",
  "BILLING_PACKAGE_MISSING", "BILLING_PURCHASE_FAILURE", "BILLING_RESTORE_FAILURE",
  "ENTITLEMENT_REFRESH_FAILURE", "STORAGE_READ_FAILURE", "STORAGE_WRITE_FAILURE",
  "STORAGE_PARSE_FAILURE", "AI_NETWORK_FAILURE", "AI_TIMEOUT", "AI_PROVIDER_FAILURE",
  "AI_INVALID_RESPONSE", "STARTUP_FAILURE",
]);
const OPERATIONS = new Set<OperationCategory>(["billing", "entitlement", "storage", "ai_network", "startup", "rendering"]);
const STORAGE_CATEGORIES = new Set<StorageCategory>(["progress", "theme", "ai_usage"]);

function safeErrorClass(error: unknown): string {
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(error.name)) {
    return error.name;
  }
  return "UnknownError";
}

function sanitizeStack(stack: unknown): string | undefined {
  if (typeof stack !== "string") return undefined;
  const frames = stack
    .split("\n")
    .slice(1, 31)
    .filter((line) => /^\s*at\s/.test(line))
    .map((line) => line.slice(0, 300));
  return frames.length ? `SanitizedError\n${frames.join("\n")}` : undefined;
}

function sanitizeComponentStack(stack: unknown): string | undefined {
  if (typeof stack !== "string") return undefined;
  const safeLines = stack
    .split("\n")
    .slice(0, 30)
    .filter((line) => /^\s*(at|in)\s+[A-Za-z0-9_.$<>-]+/.test(line))
    .map((line) => line.slice(0, 200));
  return safeLines.length ? safeLines.join("\n") : undefined;
}

function sanitizeEventStacktrace(stacktrace: unknown): unknown {
  if (!stacktrace || typeof stacktrace !== "object") return undefined;
  const frames = (stacktrace as { frames?: unknown }).frames;
  if (!Array.isArray(frames)) return undefined;
  return {
    frames: frames.slice(-50).map((frame) => {
      if (!frame || typeof frame !== "object") return {};
      const source = frame as Record<string, unknown>;
      const safe: Record<string, unknown> = {};
      for (const key of ["abs_path", "filename", "function", "module"]) {
        if (typeof source[key] === "string") safe[key] = source[key].slice(0, 300);
      }
      for (const key of ["lineno", "colno"]) {
        if (typeof source[key] === "number") safe[key] = source[key];
      }
      if (typeof source.in_app === "boolean") safe.in_app = source.in_app;
      return safe;
    }),
  };
}

function statusClass(status: number | undefined): string | undefined {
  if (!Number.isInteger(status) || status! < 100 || status! > 599) return undefined;
  return `${Math.floor(status! / 100)}xx`;
}

export function sanitizeEventForReporting(event: ReporterEvent): ReporterEvent {
  delete event.user;
  delete event.request;
  delete event.breadcrumbs;
  delete event.extra;
  delete event.message;

  const safeTags: Record<string, string> = {};
  const errorCategory = event.tags?.error_category;
  const operation = event.tags?.operation;
  const storage = event.tags?.storage;
  const httpStatusClass = event.tags?.http_status_class;
  if (typeof errorCategory === "string" && ERROR_CATEGORIES.has(errorCategory as MobileErrorCategory)) safeTags.error_category = errorCategory;
  if (typeof operation === "string" && OPERATIONS.has(operation as OperationCategory)) safeTags.operation = operation;
  if (typeof storage === "string" && STORAGE_CATEGORIES.has(storage as StorageCategory)) safeTags.storage = storage;
  if (typeof httpStatusClass === "string" && /^[1-5]xx$/.test(httpStatusClass)) safeTags.http_status_class = httpStatusClass;
  event.tags = safeTags;

  const diagnostic = event.contexts?.diagnostic;
  const safeDiagnostic: Record<string, string> = {};
  if (diagnostic && typeof diagnostic === "object") {
    const candidate = diagnostic as Record<string, unknown>;
    if (typeof candidate.errorClass === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(candidate.errorClass)) {
      safeDiagnostic.errorClass = candidate.errorClass;
    }
    const componentStack = sanitizeComponentStack(candidate.componentStack);
    if (componentStack) safeDiagnostic.componentStack = componentStack;
  }
  event.contexts = Object.keys(safeDiagnostic).length ? { diagnostic: safeDiagnostic } : {};

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((value) => ({
      type: typeof value.type === "string" ? value.type.slice(0, 80) : "Error",
      value: "Sanitized application error",
      ...(sanitizeEventStacktrace(value.stacktrace)
        ? { stacktrace: sanitizeEventStacktrace(value.stacktrace) }
        : {}),
    }));
  }

  return event;
}

function loadReporter(): ReporterAdapter {
  // Literal lazy require keeps Node unit tests independent of the native module
  // while still allowing Metro to bundle the Expo-compatible SDK.
  const loaded = require("@sentry/react-native") as ReporterAdapter;
  return loaded;
}

export function initializeObservability(options?: {
  dsn?: string;
  environment?: "development" | "production";
  adapter?: ReporterAdapter;
}): boolean {
  if (initialized) return Boolean(reporter);
  initialized = true;

  const dsn = options?.dsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;

  try {
    reporter = options?.adapter ?? loadReporter();
    reporter.init({
      dsn,
      environment:
        options?.environment ??
        (typeof __DEV__ !== "undefined" && __DEV__ ? "development" : "production"),
      sendDefaultPii: false,
      enableNative: true,
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: false,
      tracesSampleRate: 0,
      profilesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeBreadcrumb: () => null,
      beforeSend: sanitizeEventForReporting,
    });
    return true;
  } catch {
    reporter = null;
    return false;
  }
}

export function captureOperationalError({
  category,
  operation,
  error,
  storage,
  httpStatus,
  componentStack,
}: OperationalError): void {
  if (!reporter) return;

  try {
    const errorClass = safeErrorClass(error);
    const sanitized = new Error(`${category}:${errorClass}`);
    sanitized.name = errorClass;
    sanitized.stack = sanitizeStack(error instanceof Error ? error.stack : undefined);

    const tags: Record<string, string> = {
      error_category: category,
      operation,
    };
    if (storage) tags.storage = storage;
    const httpStatusClass = statusClass(httpStatus);
    if (httpStatusClass) tags.http_status_class = httpStatusClass;

    const safeComponentStack = sanitizeComponentStack(componentStack);
    const context: Record<string, unknown> = { errorClass };
    if (safeComponentStack) context.componentStack = safeComponentStack;

    if (error) {
      reporter.captureException(sanitized, {
        tags,
        contexts: { diagnostic: context },
      });
    } else {
      reporter.captureMessage(category, {
        level: "error",
        tags,
        contexts: { diagnostic: context },
      });
    }
  } catch {
    // Observability must never affect application behavior.
  }
}

export function captureBillingFailure(
  category: Extract<
    MobileErrorCategory,
    | "BILLING_CONFIGURATION_FAILURE"
    | "BILLING_OFFERINGS_FAILURE"
    | "BILLING_PACKAGE_MISSING"
    | "BILLING_PURCHASE_FAILURE"
    | "BILLING_RESTORE_FAILURE"
  >,
  error?: unknown,
  cancelled = false,
): void {
  if (cancelled) return;
  captureOperationalError({ category, operation: "billing", error });
}

export function createErrorBoundaryReporter() {
  return (error: Error, componentStack: string): void => {
    captureOperationalError({
      category: "CRASH_UNCAUGHT_ERROR",
      operation: "rendering",
      error,
      componentStack,
    });
  };
}

export function resetObservabilityForTests(): void {
  reporter = null;
  initialized = false;
}
