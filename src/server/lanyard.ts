import { connectToLanyard } from "../shared/lanyard-socket";
import {
  FALLBACK_AVATAR_URL,
  DISCORD_USER_ID,
  LANYARD_SOCKET_URL,
} from "../shared/profile";
import type { PresenceView } from "../shared/types";

export type PresenceSource = {
  getPresence(): Promise<PresenceView>;
};

export type PresenceService = PresenceSource & {
  dispose(): void;
};

export type PresenceServiceOptions = {
  userId?: string;
  url?: string;
  fallback?: PresenceView;
  WebSocketCtor?: typeof WebSocket;
  scheduler?: Pick<
    typeof globalThis,
    "setInterval" | "clearInterval" | "setTimeout" | "clearTimeout"
  >;
  onError?: (error: unknown) => void;
  initialWaitMs?: number;
};

export function createPresenceService({
  userId = DISCORD_USER_ID,
  url = LANYARD_SOCKET_URL,
  fallback = { avatarUrl: FALLBACK_AVATAR_URL },
  WebSocketCtor,
  scheduler,
  onError,
  initialWaitMs = 750,
}: PresenceServiceOptions = {}): PresenceService {
  let presence: PresenceView = fallback;
  let hasReceivedPresence = false;
  let resolveInitialPresence: (() => void) | undefined;
  const initialPresence = new Promise<void>((resolve) => {
    resolveInitialPresence = resolve;
  });
  const activeScheduler = scheduler ?? globalThis;

  const disconnect = connectToLanyard({
    userId,
    url,
    WebSocketCtor,
    scheduler,
    onError,
    onPresence(nextPresence) {
      presence = nextPresence;
      if (!hasReceivedPresence) {
        hasReceivedPresence = true;
        resolveInitialPresence?.();
      }
    },
  });

  return {
    async getPresence() {
      if (!hasReceivedPresence && initialWaitMs > 0) {
        await Promise.race([
          initialPresence,
          new Promise<void>((resolve) => {
            activeScheduler.setTimeout(resolve, initialWaitMs);
          }),
        ]);
      }
      return presence;
    },

    dispose() {
      disconnect();
    },
  };
}

let sharedPresenceService: PresenceService | undefined;

export function getPresenceService(): PresenceService {
  sharedPresenceService ??= createPresenceService({
    onError(error) {
      console.error("Lanyard server socket error", error);
    },
  });

  return sharedPresenceService;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    sharedPresenceService?.dispose();
    sharedPresenceService = undefined;
  });
}
