import type { PresenceSource } from "./lanyard";
import { renderPage } from "./render-page";

const ASSETS = new Map([
  [
    "/assets/client.js",
    { path: "dist/assets/client.js", type: "text/javascript; charset=utf-8" },
  ],
  [
    "/assets/client.js.map",
    {
      path: "dist/assets/client.js.map",
      type: "application/json; charset=utf-8",
    },
  ],
  [
    "/assets/styles.css",
    { path: "dist/assets/styles.css", type: "text/css; charset=utf-8" },
  ],
]);

const BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

const ASSET_CACHE_CONTROL = "public, max-age=0, must-revalidate";
const DEFAULT_SOCKET_URL = "wss://api.lanyard.rest/socket";

export type RequestHandlerOptions = {
  presenceSource: PresenceSource;
  socketUrl?: string | false;
  now?: () => number;
};

function contentSecurityPolicy(nonce: string): string {
  return `default-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://api.lanyard.rest https://cdn.discordapp.com https://i.scdn.co; connect-src wss://api.lanyard.rest; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
}

function plainTextResponse(
  body: string,
  status: number,
  headers?: HeadersInit,
): Response {
  return new Response(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

export function createRequestHandler({
  presenceSource,
  socketUrl = DEFAULT_SOCKET_URL,
  now = Date.now,
}: RequestHandlerOptions): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    const asset = ASSETS.get(url.pathname);
    const isDocument = url.pathname === "/";
    const isHealth = url.pathname === "/healthz";

    if (!isDocument && !isHealth && asset === undefined) {
      return plainTextResponse("Not Found", 404);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return plainTextResponse("Method Not Allowed", 405, {
        Allow: "GET, HEAD",
      });
    }

    const isHead = request.method === "HEAD";

    if (isHealth) {
      return new Response(isHead ? null : '{"ok":true}', {
        headers: {
          ...BASE_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    if (asset !== undefined) {
      return new Response(isHead ? null : Bun.file(asset.path), {
        headers: {
          ...BASE_HEADERS,
          "Content-Type": asset.type,
          "Cache-Control": ASSET_CACHE_CONTROL,
        },
      });
    }

    const nonce = crypto.randomUUID();
    const html = await renderPage({
      presence: await presenceSource.getPresence(),
      origin: url.origin,
      nonce,
      socketUrl,
      now: now(),
    });

    return new Response(isHead ? null : html, {
      headers: {
        ...BASE_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": contentSecurityPolicy(nonce),
      },
    });
  };
}
