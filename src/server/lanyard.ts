import { connectToLanyard } from "../shared/lanyard-socket";
import { FALLBACK_AVATAR_URL, DISCORD_USER_ID } from "../shared/profile";
import type { PresenceView } from "../shared/types";

const LANYARD_SOCKET_URL = "wss://api.lanyard.rest/socket";

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
};

export function createPresenceService({
  userId = DISCORD_USER_ID,
  url = LANYARD_SOCKET_URL,
  fallback = { avatarUrl: FALLBACK_AVATAR_URL },
  WebSocketCtor,
  scheduler,
  onError,
}: PresenceServiceOptions = {}): PresenceService {
  let presence: PresenceView = fallback;

  const disconnect = connectToLanyard({
    userId,
    url,
    WebSocketCtor,
    scheduler,
    onError,
    onPresence(nextPresence) {
      presence = nextPresence;
    },
  });

  return {
    async getPresence() {
      return presence;
    },

    dispose() {
      disconnect();
    },
  };
}
