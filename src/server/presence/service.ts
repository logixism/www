import { FALLBACK_AVATAR_URL } from "../../shared/profile";
import type { Activity, PresenceView } from "../../shared/types";

export type PresenceProvider = {
  subscribe(listener: (presence: PresenceView) => void): () => void;
};

export type PresenceService = {
  getPresence(): Promise<PresenceView>;
  subscribe(listener: (presence: PresenceView) => void): () => void;
  dispose(): void;
};

export type PresenceEnricher = {
  enrich(presence: PresenceView): Promise<PresenceView>;
  dispose?(): void | Promise<void>;
};

export type PresenceServiceOptions = {
  provider: PresenceProvider;
  enrichers?: readonly PresenceEnricher[];
  fallback?: PresenceView;
  initialWaitMs?: number;
  now?: () => number;
  scheduler?: Pick<typeof globalThis, "setTimeout" | "clearTimeout">;
  onError?: (error: unknown) => void;
};

function presencesEqual(left: PresenceView, right: PresenceView): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createPresenceService({
  provider,
  enrichers = [],
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
  let lastProviderPresence: PresenceView | undefined;
  let receivedInitial = false;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<(presence: PresenceView) => void>();
  let resolveInitial!: () => void;
  const initial = new Promise<void>((resolve) => {
    resolveInitial = resolve;
  });

  const publish = (presence: PresenceView): void => {
    if (presencesEqual(current, presence)) return;
    current = presence;
    for (const listener of listeners) listener(presence);
  };

  const resolveFirstUpdate = (): void => {
    if (receivedInitial) return;
    receivedInitial = true;
    resolveInitial();
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

  const applyEnrichers = async (
    presence: PresenceView,
    updateGeneration: number,
  ): Promise<void> => {
    let enriched = presence;
    for (const enricher of enrichers) {
      if (disposed || generation !== updateGeneration) return;
      try {
        enriched = await enricher.enrich(enriched);
      } catch (error) {
        onError?.(error);
      }
    }

    if (disposed || generation !== updateGeneration) {
      return;
    }
    if (enriched.activity !== undefined) lastActivity = enriched.activity;
    publish(enriched);
    resolveFirstUpdate();
  };

  const disconnect = provider.subscribe((presence) => {
    if (
      lastProviderPresence !== undefined &&
      presencesEqual(lastProviderPresence, presence)
    ) {
      return;
    }
    lastProviderPresence = presence;

    const updateGeneration = ++generation;
    const recorded = recordActivity(presence);
    if (enrichers.length > 0) {
      void applyEnrichers(recorded, updateGeneration);
      return;
    }

    publish(recorded);
    resolveFirstUpdate();
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
      for (const enricher of enrichers) {
        try {
          void Promise.resolve(enricher.dispose?.()).catch((error: unknown) =>
            onError?.(error),
          );
        } catch (error) {
          onError?.(error);
        }
      }
      listeners.clear();
    },
  };
}
