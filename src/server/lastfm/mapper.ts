import type { Activity } from "../../shared/types";

type UnknownRecord = Record<string, unknown>;

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
  if (Array.isArray(tracks)) return tracks.find(isRecord);
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
