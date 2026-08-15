import type { Activity } from "./types";

export function formatTimeElapsed(time: number): string {
  const totalSeconds = Math.max(0, Math.floor(time / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0) {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function calculateProgress(
  activity: Activity,
  now: number,
): number | undefined {
  if (activity.endsAt === undefined) return undefined;

  const total = activity.endsAt - activity.startedAt;
  if (!Number.isFinite(total) || total <= 0) return undefined;

  const elapsed = now - activity.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
