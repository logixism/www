import { mapLanyardPresence } from "../shared/presence";
import type { PresenceView } from "../shared/types";

type SocketOptions = {
  userId: string;
  url: string;
  onPresence: (presence: PresenceView) => void;
  onError?: (error: unknown) => void;
  WebSocketCtor?: typeof WebSocket;
  scheduler?: Pick<
    typeof globalThis,
    "setInterval" | "clearInterval" | "setTimeout" | "clearTimeout"
  >;
};

type GatewayMessage = Record<string, unknown>;

const RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];

function isRecord(value: unknown): value is GatewayMessage {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function heartbeatInterval(value: unknown): number {
  if (!isRecord(value) || typeof value.heartbeat_interval !== "number") {
    throw new TypeError("Lanyard Hello message is missing heartbeat_interval");
  }
  if (!Number.isFinite(value.heartbeat_interval) || value.heartbeat_interval <= 0) {
    throw new TypeError("Lanyard heartbeat_interval must be a positive number");
  }
  return value.heartbeat_interval;
}

export function connectToLanyard(options: SocketOptions): () => void {
  const WebSocketCtor = options.WebSocketCtor ?? WebSocket;
  const scheduler = options.scheduler ?? globalThis;
  let socket: WebSocket | undefined;
  let heartbeat: ReturnType<typeof globalThis.setInterval> | undefined;
  let reconnect: ReturnType<typeof globalThis.setTimeout> | undefined;
  let attempt = 0;
  let disposed = false;

  const report = (error: unknown): void => options.onError?.(error);

  const clearHeartbeat = (): void => {
    if (heartbeat === undefined) return;
    scheduler.clearInterval(heartbeat);
    heartbeat = undefined;
  };

  const clearReconnect = (): void => {
    if (reconnect === undefined) return;
    scheduler.clearTimeout(reconnect);
    reconnect = undefined;
  };

  const openSocket = (): void => {
    if (disposed) return;

    const current = new WebSocketCtor(options.url);
    socket = current;

    current.onmessage = (event): void => {
      if (disposed || socket !== current) return;
      try {
        if (typeof event.data !== "string") {
          throw new TypeError("Lanyard message data must be a string");
        }
        const message: unknown = JSON.parse(event.data);
        if (!isRecord(message)) return;

        if (message.op === 1) {
          const interval = heartbeatInterval(message.d);
          attempt = 0;
          clearHeartbeat();
          current.send(JSON.stringify({ op: 2, d: { subscribe_to_id: options.userId } }));
          heartbeat = scheduler.setInterval(() => {
            if (!disposed && socket === current && current.readyState === 1) {
              current.send(JSON.stringify({ op: 3 }));
            }
          }, interval);
          return;
        }

        if (
          message.op === 0 &&
          (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE")
        ) {
          const presence = mapLanyardPresence(message.d);
          if (presence !== undefined) options.onPresence(presence);
        }
      } catch (error) {
        report(error);
      }
    };

    current.onerror = (event): void => {
      if (!disposed && socket === current) report(event);
    };

    current.onclose = (): void => {
      if (disposed || socket !== current || reconnect !== undefined) return;

      clearHeartbeat();
      socket = undefined;
      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]!;
      attempt += 1;
      reconnect = scheduler.setTimeout(() => {
        reconnect = undefined;
        openSocket();
      }, delay);
    };
  };

  openSocket();

  return (): void => {
    if (disposed) return;
    disposed = true;
    clearHeartbeat();
    clearReconnect();
    socket?.close();
  };
}
