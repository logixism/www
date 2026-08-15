import { expect, test } from "bun:test";
import { createPresenceEventStream } from "../../src/pages/api/presence";
import type { PresenceView } from "../../src/shared/types";

test("streams the current presence and unsubscribes when aborted", async () => {
  const presence: PresenceView = {
    avatarUrl: "https://example.com/avatar.webp",
  };
  let unsubscribed = false;
  const abort = new AbortController();
  const stream = createPresenceEventStream(
    {
      subscribe(listener) {
        listener(presence);
        return () => {
          unsubscribed = true;
        };
      },
    },
    abort.signal,
    {
      setInterval: (() => 1) as unknown as typeof globalThis.setInterval,
      clearInterval: () => undefined,
    },
  );
  const reader = stream.getReader();

  const first = await reader.read();
  expect(new TextDecoder().decode(first.value)).toBe(
    'data: {"avatarUrl":"https://example.com/avatar.webp"}\n\n',
  );

  abort.abort();
  await reader.closed;
  expect(unsubscribed).toBe(true);
});
