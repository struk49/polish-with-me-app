import app from "./app";
import { logger } from "./lib/logger";
import { fatalProcessEvent } from "./lib/apiObservability";

function terminateAfterFatal(event: "unhandled_rejection" | "uncaught_exception", error: unknown) {
  logger.fatal(fatalProcessEvent(event, error), `process_event:${event}`);
  process.exit(1);
}

process.once("unhandledRejection", (reason) => terminateAfterFatal("unhandled_rejection", reason));
process.once("uncaughtException", (error) => terminateAfterFatal("uncaught_exception", error));

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
