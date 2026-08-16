import type { Activity } from "../shared/types";

type UnknownRecord = Record<string, unknown>;

export type ActivityProvider = {
  subscribe(listener: (activity: Activity | undefined) => void): () => void;
};

export type LastFmActivityProviderOptions = {
  apiKey: string;
  username: string;
  fetch?: typeof globalThis.fetch;
  intervalMs?: number;
  now?: () => number;
  scheduler?: Pick<typeof globalThis, "setInterval" | "clearInterval">;
  onError?: (error: unknown) => void;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonemptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function getTrack(input: unknown): UnknownRecord | undefined {
  if (!isRecord(input) || !isRecord(input.recenttracks)) return undefined;
  const tracks = input.recenttracks.track;
  if (Array.isArray(tracks)) {
    return tracks.find(isRecord);
  }
  return isRecord(tracks) ? tracks : undefined;
}

function getArtist(track: UnknownRecord): string | undefined {
  const artist = track.artist;
  if (typeof artist === "string") return nonemptyString(artist);
  return isRecord(artist) ? nonemptyString(artist["#text"]) : undefined;
}

function getArtwork(track: UnknownRecord): string | undefined {
  if (!Array.isArray(track.image)) return undefined;
  for (const candidate of track.image.toReversed()) {
    if (!isRecord(candidate)) continue;
    const url = nonemptyString(candidate["#text"]);
    if (url !== undefined) return url;
  }
  return undefined;
}

export function mapLastFmRecentTracksResponse(
  input: unknown,
  now = Date.now(),
): Activity | undefined {
  const track = getTrack(input);
  if (track === undefined || !isRecord(track["@attr"])) return undefined;
  if (track["@attr"].nowplaying !== "true") return undefined;

  const name = nonemptyString(track.name);
  const artist = getArtist(track);
  if (name === undefined || artist === undefined) return undefined;

  const href = nonemptyString(track.url);
  const imageUrl = getArtwork(track);
  return {
    type: "listening",
    name,
    details: artist,
    ...(href === undefined ? {} : { href }),
    ...(imageUrl === undefined ? {} : { imageUrl }),
    startedAt: now,
  };
}

export function mapLastFmTrackInfoDuration(input: unknown): number | undefined {
  if (!isRecord(input) || !isRecord(input.track)) return undefined;
  const rawDuration = input.track.duration;
  const duration =
    typeof rawDuration === "number"
      ? rawDuration
      : typeof rawDuration === "string"
        ? Number(rawDuration)
        : Number.NaN;
  return Number.isFinite(duration) && duration > 0 ? duration : undefined;
}

function activityKey(activity: Activity): string {
  return `${activity.name}\u0000${activity.details ?? ""}\u0000${activity.href ?? ""}`;
}

export function createLastFmActivityProvider({
  apiKey,
  username,
  fetch: fetchFn = globalThis.fetch,
  intervalMs = 1_000,
  now = Date.now,
  scheduler = globalThis,
  onError,
}: LastFmActivityProviderOptions): ActivityProvider {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "user.getrecenttracks");
  url.searchParams.set("user", username);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const durations = new Map<string, Promise<number | undefined>>();

  const getDuration = (activity: Activity): Promise<number | undefined> => {
    const key = activityKey(activity);
    let pending = durations.get(key);
    if (pending !== undefined) return pending;

    const trackUrl = new URL("https://ws.audioscrobbler.com/2.0/");
    trackUrl.searchParams.set("method", "track.getInfo");
    trackUrl.searchParams.set("artist", activity.details ?? "");
    trackUrl.searchParams.set("track", activity.name);
    trackUrl.searchParams.set("username", username);
    trackUrl.searchParams.set("api_key", apiKey);
    trackUrl.searchParams.set("format", "json");
    trackUrl.searchParams.set("autocorrect", "1");

    pending = fetchFn(trackUrl, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Last.fm track info request failed with ${response.status}`,
          );
        }
        return mapLastFmTrackInfoDuration(await response.json());
      })
      .catch((error: unknown) => {
        durations.delete(key);
        onError?.(error);
        return undefined;
      });
    durations.set(key, pending);
    return pending;
  };

  return {
    subscribe(listener) {
      let current: Activity | undefined;
      let stopped = false;
      let polling = false;

      const poll = async (): Promise<void> => {
        if (stopped || polling) return;
        polling = true;
        try {
          const response = await fetchFn(url, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) {
            throw new Error(`Last.fm request failed with ${response.status}`);
          }

          let next = mapLastFmRecentTracksResponse(
            await response.json(),
            now(),
          );
          if (
            next !== undefined &&
            current !== undefined &&
            activityKey(next) === activityKey(current)
          ) {
            next = { ...next, startedAt: current.startedAt };
          }
          if (next !== undefined) {
            const duration = await getDuration(next);
            if (duration !== undefined) {
              next = { ...next, endsAt: next.startedAt + duration };
            }
          }
          current = next;
          if (!stopped) listener(next);
        } catch (error) {
          if (!stopped) onError?.(error);
        } finally {
          polling = false;
        }
      };

      void poll();
      const timer = scheduler.setInterval(() => void poll(), intervalMs);
      return () => {
        stopped = true;
        scheduler.clearInterval(timer);
      };
    },
  };
}
