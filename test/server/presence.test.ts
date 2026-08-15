import { describe, expect, test } from "bun:test";
import {
  createPresenceService,
  type PresenceProvider,
} from "../../src/server/presence";
import type { PresenceView } from "../../src/shared/types";

function fakeProvider(): {
  provider: PresenceProvider;
  emit: (presence: PresenceView) => void;
  disposed: () => boolean;
} {
  let listener: ((presence: PresenceView) => void) | undefined;
  let isDisposed = false;
  return {
    provider: {
      subscribe(next) {
        listener = next;
        return () => {
          isDisposed = true;
          listener = undefined;
        };
      },
    },
    emit(presence) {
      listener?.(presence);
    },
    disposed: () => isDisposed,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const fallback: PresenceView = {
  avatarUrl: "https://example.com/fallback.webp",
};

function game(name: string): PresenceView {
  return {
    avatarUrl: "https://example.com/avatar.webp",
    activity: { type: "playing", name, startedAt: 1_000 },
  };
}

describe("PresenceService", () => {
  test("publishes base presence before its enriched follow-up", async () => {
    const source = fakeProvider();
    const artwork = deferred<PresenceView>();
    const service = createPresenceService({
      provider: source.provider,
      fallback,
      initialWaitMs: 0,
      enrich: () => artwork.promise,
    });
    const received: PresenceView[] = [];
    service.subscribe((presence) => received.push(presence));

    const base = game("Hades");
    source.emit(base);
    expect(received).toEqual([fallback, base]);

    const enriched = {
      ...base,
      activity: {
        ...base.activity!,
        imageUrl: "https://images.igdb.com/hades.jpg",
      },
    };
    artwork.resolve(enriched);
    await artwork.promise;
    await Promise.resolve();

    expect(received).toEqual([fallback, base, enriched]);
    service.dispose();
    expect(source.disposed()).toBe(true);
  });

  test("discards enrichment that resolves after a newer snapshot", async () => {
    const source = fakeProvider();
    const firstArtwork = deferred<PresenceView>();
    const secondArtwork = deferred<PresenceView>();
    const service = createPresenceService({
      provider: source.provider,
      fallback,
      initialWaitMs: 0,
      enrich: (presence) =>
        presence.activity?.name === "First"
          ? firstArtwork.promise
          : secondArtwork.promise,
    });
    const received: PresenceView[] = [];
    service.subscribe((presence) => received.push(presence));

    const first = game("First");
    const second = game("Second");
    source.emit(first);
    source.emit(second);
    firstArtwork.resolve({
      ...first,
      activity: {
        ...first.activity!,
        imageUrl: "https://example.com/stale.jpg",
      },
    });
    await firstArtwork.promise;
    await Promise.resolve();

    expect(await service.getPresence()).toBe(second);
    expect(received.at(-1)).toBe(second);
    service.dispose();
  });
});
