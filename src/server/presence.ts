import { IGDBClient, buildImageUrl } from "@api-wrappers/igdb-wrapper";
import { FALLBACK_AVATAR_URL } from "../shared/profile";
import type { PresenceView } from "../shared/types";
import { getServerEnv } from "./env";
import { createIgdbGameArtworkEnricher } from "./igdb";
import {
  createLastFmActivityProvider,
  type ActivityProvider,
} from "./lastfm";
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
  now?: () => number;
  scheduler?: Pick<typeof globalThis, "setTimeout" | "clearTimeout">;
  onError?: (error: unknown) => void;
};

export function combinePresenceWithActivity(
  provider: PresenceProvider,
  activityProvider: ActivityProvider,
): PresenceProvider {
  return {
    subscribe(listener) {
      let presence: PresenceView | undefined;
      let activity: PresenceView["activity"];

      const publish = (): void => {
        if (presence === undefined) return;
        listener({
          ...presence,
          activity: activity ?? presence.activity,
        });
      };

      const disconnectPresence = provider.subscribe((next) => {
        presence = next;
        publish();
      });
      const disconnectActivity = activityProvider.subscribe((next) => {
        activity = next;
        publish();
      });

      return () => {
        disconnectPresence();
        disconnectActivity();
      };
    },
  };
}

export function createPresenceService({
  provider,
  enrich,
  fallback = { avatarUrl: FALLBACK_AVATAR_URL },
  initialWaitMs = 750,
  now = Date.now,
  scheduler = globalThis,
  onError,
}: PresenceServiceOptions): PresenceService {
  let current = fallback;
  let lastActivity = fallback.activity ?? fallback.lastActivity;
  let activityGoneAt = fallback.activityGoneAt;
  let hadCurrentActivity = fallback.activity !== undefined;
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

  const recordActivity = (presence: PresenceView): PresenceView => {
    if (presence.activity !== undefined) {
      lastActivity = presence.activity;
      activityGoneAt = undefined;
      hadCurrentActivity = true;
      return presence;
    }

    if (hadCurrentActivity) activityGoneAt = now();
    hadCurrentActivity = false;
    if (lastActivity === undefined) return presence;

    return {
      ...presence,
      lastActivity,
      ...(activityGoneAt === undefined ? {} : { activityGoneAt }),
    };
  };

  const disconnect = provider.subscribe((presence) => {
    const updateGeneration = ++generation;
    publish(recordActivity(presence));
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
        if (enriched.activity !== undefined) lastActivity = enriched.activity;
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
    provider: combinePresenceWithActivity(
      createLanyardPresenceProvider({
        onError(error) {
          console.error("Lanyard server socket error", error);
        },
      }),
      createLastFmActivityProvider({
        apiKey: env.LASTFM_API_KEY,
        username: env.LASTFM_USERNAME,
        onError(error) {
          console.error("Could not fetch Last.fm activity", error);
        },
      }),
    ),
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
