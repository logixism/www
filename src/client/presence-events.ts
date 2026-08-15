import type { PresenceView } from "../shared/types";

type PresenceEventSource = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  close(): void;
};

type PresenceEventSourceConstructor = new (url: string) => PresenceEventSource;

export type PresenceEventsOptions = {
  onPresence: (presence: PresenceView) => void;
  onError?: (error: unknown) => void;
  EventSourceCtor?: PresenceEventSourceConstructor;
};

export function connectToPresenceEvents({
  onPresence,
  onError,
  EventSourceCtor = EventSource,
}: PresenceEventsOptions): () => void {
  const events = new EventSourceCtor("/api/presence");
  events.onmessage = (event): void => {
    try {
      onPresence(JSON.parse(event.data) as PresenceView);
    } catch (error) {
      onError?.(error);
    }
  };

  return () => events.close();
}
