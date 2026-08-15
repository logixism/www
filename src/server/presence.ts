import { IGDBClient, buildImageUrl } from "@api-wrappers/igdb-wrapper";
import { FALLBACK_AVATAR_URL } from "../shared/profile";
import type { PresenceView } from "../shared/types";
import { getServerEnv } from "./env";
import { createIgdbGameArtworkEnricher } from "./igdb";
import { createLanyardPresenceProvider } from "./lanyard";

export type PresenceProvider = {
  subscribe(listener: (presence: PresenceView) => void): () => void;
};

export type PresenceService = {
  getPresence(): Promise<PresenceView>;
  subscribe(listener: (presence: PresenceView) => void): () => void;
  dispose(): void;
};

export type PresenceServiceOptions = {
  provider: PresenceProvider;
  enrich?: (presence: PresenceView) => Promise<PresenceView>;
  fallback?: PresenceView;
  initialWaitMs?: number;
  scheduler?: Pick<typeof globalThis, "setTimeout" | "clearTimeout">;
  onError?: (error: unknown) => void;
};

export function createPresenceService({
  provider,
  enrich,
  fallback = { avatarUrl: FALLBACK_AVATAR_URL },
  initialWaitMs = 750,
  scheduler = globalThis,
  onError,
}: PresenceServiceOptions): PresenceService {
  let current = fallback;
  let receivedInitial = false;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<(presence: PresenceView) => void>();
  let resolveInitial!: () => void;
  const initial = new Promise<void>((resolve) => {
    resolveInitial = resolve;
  });

  const publish = (presence: PresenceView): void => {
    current = presence;
    for (const listener of listeners) listener(presence);
  };

  const disconnect = provider.subscribe((presence) => {
    const updateGeneration = ++generation;
    publish(presence);
    if (!receivedInitial) {
      receivedInitial = true;
      resolveInitial();
    }
    if (enrich === undefined) return;

    void enrich(presence)
      .then((enriched) => {
        if (
          disposed ||
          generation !== updateGeneration ||
          enriched === presence
        ) {
          return;
        }
        publish(enriched);
      })
      .catch((error: unknown) => onError?.(error));
  });

  return {
    async getPresence() {
      if (!receivedInitial && initialWaitMs > 0) {
        await new Promise<void>((resolve) => {
          const timeout = scheduler.setTimeout(resolve, initialWaitMs);
          void initial.then(() => {
            scheduler.clearTimeout(timeout);
            resolve();
          });
        });
      }
      return current;
    },

    subscribe(listener) {
      listener(current);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      disconnect();
      listeners.clear();
    },
  };
}

let sharedPresenceService: PresenceService | undefined;
let sharedIgdbClient: IGDBClient | undefined;

export function getPresenceService(): PresenceService {
  if (sharedPresenceService !== undefined) return sharedPresenceService;

  const env = getServerEnv();
  const igdb = new IGDBClient({
    clientId: env.TWITCH_CLIENT_ID,
    clientSecret: env.TWITCH_CLIENT_SECRET,
  });
  const enrich = createIgdbGameArtworkEnricher({
    searchGames: async (name) =>
      igdb.games
        .search(name)
        .fields(
          "name, cover.image_id, external_games.external_game_source.name, external_games.uid, external_games.url",
        )
        .limit(10)
        .execute(),
    buildArtworkUrl: (imageId) =>
      buildImageUrl(imageId, { size: "cover_big", retina: true }),
    onError(error) {
      console.error("Could not fetch IGDB game artwork", error);
    },
  });

  sharedIgdbClient = igdb;
  sharedPresenceService = createPresenceService({
    provider: createLanyardPresenceProvider({
      onError(error) {
        console.error("Lanyard server socket error", error);
      },
    }),
    enrich,
    onError(error) {
      console.error("Could not enrich presence", error);
    },
  });
  return sharedPresenceService;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    sharedPresenceService?.dispose();
    void sharedIgdbClient?.dispose();
    sharedPresenceService = undefined;
    sharedIgdbClient = undefined;
  });
}
