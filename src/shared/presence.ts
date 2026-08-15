import { DISCORD_USER_ID } from "./profile";
import type { Activity, ActivityType, PresenceView } from "./types";

const CODING_ACTIVITY_NAME =
  /(?:code|visual studio|jetbrains|intellij|webstorm|pycharm|rider|zed)/i;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(record: UnknownRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getActivityType(type: number, name: string): ActivityType {
  if (type === 2) return "listening";
  if (type === 1 || type === 3) return "watching";
  if (CODING_ACTIVITY_NAME.test(name)) return "coding";
  return "playing";
}

function getAvatarUrl(input: UnknownRecord): string | undefined {
  const discordUser = input.discord_user;
  if (!isRecord(discordUser)) return undefined;

  const avatar = getString(discordUser, "avatar");
  if (avatar === undefined) return undefined;

  return `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${avatar}.webp?quality=lossless`;
}

function getSpotifyActivity(input: UnknownRecord): Activity | undefined {
  const spotify = input.spotify;
  if (!isRecord(spotify)) return undefined;

  const song = getString(spotify, "song");
  const artist = getString(spotify, "artist");
  const trackId = getString(spotify, "track_id");
  const imageUrl = getString(spotify, "album_art_url");
  const timestamps = spotify.timestamps;
  if (
    song === undefined ||
    artist === undefined ||
    trackId === undefined ||
    imageUrl === undefined ||
    !isRecord(timestamps)
  ) {
    return undefined;
  }

  const startedAt = getNumber(timestamps, "start");
  const endsAt = getNumber(timestamps, "end");
  if (startedAt === undefined || endsAt === undefined) return undefined;

  return {
    type: "listening",
    name: song,
    details: artist,
    imageUrl,
    href: `https://open.spotify.com/track/${trackId}`,
    startedAt,
    endsAt,
  };
}

function getDiscordActivity(
  activities: unknown[],
  now: number,
): Activity | undefined {
  let activity: UnknownRecord | undefined;
  for (const candidate of activities) {
    if (!isRecord(candidate) || candidate.type === 4) continue;
    activity = candidate;
    break;
  }
  if (activity === undefined) return undefined;

  const type = getNumber(activity, "type");
  const name = getString(activity, "name");
  if (type === undefined || name === undefined) return undefined;

  const timestamps = isRecord(activity.timestamps) ? activity.timestamps : undefined;
  const startedAt =
    timestamps === undefined ? undefined : getNumber(timestamps, "start");
  const endsAt = timestamps === undefined ? undefined : getNumber(timestamps, "end");
  const createdAt = getNumber(activity, "created_at");
  const details = getString(activity, "details");

  return {
    type: getActivityType(type, name),
    name,
    ...(details === undefined ? {} : { details }),
    startedAt: startedAt ?? createdAt ?? now,
    ...(endsAt === undefined ? {} : { endsAt }),
  };
}

export function mapLanyardPresence(
  input: unknown,
  now = Date.now(),
): PresenceView | undefined {
  if (!isRecord(input) || !Array.isArray(input.activities)) return undefined;

  const avatarUrl = getAvatarUrl(input);
  if (avatarUrl === undefined) return undefined;

  if (input.listening_to_spotify === true) {
    const activity = getSpotifyActivity(input);
    return activity === undefined ? undefined : { avatarUrl, activity };
  }

  if (input.listening_to_spotify !== false) return undefined;

  const activity = getDiscordActivity(input.activities, now);
  return activity === undefined ? { avatarUrl } : { avatarUrl, activity };
}

export function mapLanyardResponse(
  input: unknown,
  now = Date.now(),
): PresenceView | undefined {
  if (!isRecord(input) || input.success !== true) return undefined;

  return mapLanyardPresence(input.data, now);
}
