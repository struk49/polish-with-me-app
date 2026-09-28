import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { logApiEvent, unexpectedErrorHandler } from "./lib/apiObservability";
import { privacyPolicyHtml } from "./privacyPolicy";

const app: Express = express();

// Render terminates client connections at one trusted proxy hop.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const configuredOrigins = new Set(
  (process.env["AI_TUTOR_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (configuredOrigins.has(origin)) return callback(null, true);
      if (
        process.env["NODE_ENV"] !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);

app.get(["/privacy-policy", "/privacy-policy/"], (_req, res) => {
  res.type("html").status(200).send(privacyPolicyHtml);
});

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const bodyErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const bodyError = err as { status?: unknown; type?: unknown };
  if (bodyError.type === "entity.parse.failed") {
    logApiEvent(req, "warn", "validation_rejected", { statusCode: 400, error: err });
    res.status(400).json({ error: { code: "MALFORMED_JSON", message: "Malformed JSON." } });
    return;
  }
  if (bodyError.status === 413) {
    logApiEvent(req, "warn", "validation_rejected", { statusCode: 413, error: err });
    res.status(413).json({ error: { code: "REQUEST_TOO_LARGE", message: "Request is too large." } });
    return;
  }
  next(err);
};

app.use(bodyErrorHandler);
app.use(unexpectedErrorHandler);

export default app;
