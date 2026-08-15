import type { APIRoute } from "astro";
import { getPresenceService } from "../../server/presence";
import type { PresenceView } from "../../shared/types";

type PresenceUpdates = {
  subscribe(listener: (presence: PresenceView) => void): () => void;
};

type IntervalTimers = Pick<
  typeof globalThis,
  "setInterval" | "clearInterval"
>;

const encoder = new TextEncoder();

export function createPresenceEventStream(
  source: PresenceUpdates,
  signal: AbortSignal,
  timers: IntervalTimers = globalThis,
): ReadableStream<Uint8Array> {
  let cleanup = (): void => undefined;

  return new ReadableStream({
    start(controller) {
      let unsubscribe: (() => void) | undefined;
      let keepAlive: ReturnType<typeof globalThis.setInterval> | undefined;
      let closed = false;

      const release = (): void => {
        if (closed) return;
        closed = true;
        signal.removeEventListener("abort", abort);
        unsubscribe?.();
        if (keepAlive !== undefined) timers.clearInterval(keepAlive);
      };

      const abort = (): void => {
        release();
        controller.close();
      };

      cleanup = release;
      if (signal.aborted) {
        abort();
        return;
      }

      unsubscribe = source.subscribe((presence) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(presence)}\n\n`),
        );
      });
      keepAlive = timers.setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);
      signal.addEventListener("abort", abort, { once: true });
    },

    cancel() {
      cleanup();
    },
  });
}

export const GET = (({ request }) =>
  new Response(
    createPresenceEventStream(getPresenceService(), request.signal),
    {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        Connection: "keep-alive",
      },
    },
  )) satisfies APIRoute;
