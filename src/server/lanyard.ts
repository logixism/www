import { connectToLanyard } from "../shared/lanyard-socket";
import { DISCORD_USER_ID, LANYARD_SOCKET_URL } from "../shared/profile";
import type { PresenceProvider } from "./presence";

export type LanyardPresenceProviderOptions = {
  userId?: string;
  url?: string;
  WebSocketCtor?: typeof WebSocket;
  scheduler?: Pick<
    typeof globalThis,
    "setInterval" | "clearInterval" | "setTimeout" | "clearTimeout"
  >;
  onError?: (error: unknown) => void;
};

export function createLanyardPresenceProvider({
  userId = DISCORD_USER_ID,
  url = LANYARD_SOCKET_URL,
  WebSocketCtor,
  scheduler,
  onError,
}: LanyardPresenceProviderOptions = {}): PresenceProvider {
  return {
    subscribe(onPresence) {
      return connectToLanyard({
        userId,
        url,
        WebSocketCtor,
        scheduler,
        onError,
        onPresence,
      });
    },
  };
}
