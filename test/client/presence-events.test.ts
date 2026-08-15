import { expect, test } from "bun:test";
import { connectToPresenceEvents } from "../../src/client/presence-events";
import type { PresenceView } from "../../src/shared/types";

test("receives presence updates from the same-origin SSE endpoint", () => {
  let source: FakeEventSource | undefined;
  const received: PresenceView[] = [];

  class FakeEventSource {
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    closed = false;

    constructor(readonly url: string) {
      source = this;
    }

    close(): void {
      this.closed = true;
    }

    emit(data: string): void {
      this.onmessage?.({ data } as MessageEvent<string>);
    }
  }

  const disconnect = connectToPresenceEvents({
    EventSourceCtor: FakeEventSource,
    onPresence(presence) {
      received.push(presence);
    },
  });

  source!.emit('{"avatarUrl":"https://example.com/avatar.webp"}');
  expect(source!.url).toBe("/api/presence");
  expect(received).toEqual([
    { avatarUrl: "https://example.com/avatar.webp" },
  ]);

  disconnect();
  expect(source!.closed).toBe(true);
});
