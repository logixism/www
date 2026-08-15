import { createRequestHandler } from "./server/handler";
import { createPresenceService } from "./server/lanyard";

function startServer(): void {
  const host = Bun.env.HOST ?? "0.0.0.0";
  const portValue = Bun.env.PORT ?? "3000";
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  const handler = createRequestHandler({ presenceSource: createPresenceService() });
  Bun.serve({ hostname: host, port, fetch: handler });
  console.log(`Listening on http://${host}:${port}`);
}

if (import.meta.main) startServer();
