import { getServerEnv } from "../env";
import { createIgdbActivityEnricher } from "../igdb";
import { createLastFmActivityProvider } from "../lastfm";
import { createLanyardPresenceProvider } from "../lanyard";
import { combinePresenceWithActivity } from "./combine";
import {
  createPresenceService,
  type PresenceService,
} from "./service";

export { combinePresenceWithActivity } from "./combine";
export type { ActivityProvider } from "./combine";
export { createPresenceService } from "./service";
export type {
  PresenceEnricher,
  PresenceProvider,
  PresenceService,
  PresenceServiceOptions,
} from "./service";

let sharedPresenceService: PresenceService | undefined;

export function getPresenceService(): PresenceService {
  if (sharedPresenceService !== undefined) return sharedPresenceService;

  const env = getServerEnv();
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
    enrichers: [
      createIgdbActivityEnricher({
        clientId: env.TWITCH_CLIENT_ID,
        clientSecret: env.TWITCH_CLIENT_SECRET,
        onError(error) {
          console.error("Could not fetch IGDB game metadata", error);
        },
      }),
    ],
    onError(error) {
      console.error("Could not enrich presence", error);
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
