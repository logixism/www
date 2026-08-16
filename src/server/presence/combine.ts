import type { PresenceView } from "../../shared/types";
import type { PresenceProvider } from "./service";

export type ActivityProvider = {
  subscribe(
    listener: (activity: PresenceView["activity"]) => void,
  ): () => void;
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
