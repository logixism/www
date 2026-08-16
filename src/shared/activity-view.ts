import { cyrlat } from "./cyrlat";
import { ACTIVITY_THEMES, FALLBACK_AVATAR_URL } from "./profile";
import { calculateProgress, formatTimeElapsed } from "./time";
import type { PresenceView } from "./types";
import { safeHttpUrl } from "./url";

export type ActivityPresentation = {
  active: boolean;
  avatarUrl: string;
  details?: string;
  elapsed: string;
  href?: string;
  icon: string;
  imageUrl?: string;
  label: string;
  name: string;
  progressMode: "determinate" | "indeterminate";
  progressValue: number;
  showProgress: boolean;
  timeSuffix: "ago" | "elapsed";
  total?: string;
};

export function getActivityPresentation(
  presence: PresenceView,
  now = Date.now(),
): ActivityPresentation {
  const avatarUrl = safeHttpUrl(presence.avatarUrl) ?? FALLBACK_AVATAR_URL;
  const isCurrent = presence.activity !== undefined;
  const activity = presence.activity ?? presence.lastActivity;

  if (activity === undefined) {
    return {
      active: false,
      avatarUrl,
      elapsed: formatTimeElapsed(0),
      icon: ACTIVITY_THEMES.playing.icon,
      label: ACTIVITY_THEMES.playing.label,
      name: "",
      progressMode: "indeterminate",
      progressValue: 0,
      showProgress: false,
      timeSuffix: "elapsed",
    };
  }

  const historical = !isCurrent;
  const elapsed = historical
    ? Math.max(0, now - (presence.activityGoneAt ?? now))
    : Math.max(0, now - activity.startedAt);
  const total =
    historical || activity.endsAt === undefined
      ? undefined
      : Math.max(0, activity.endsAt - activity.startedAt);
  const hasRemainingTotal = total !== undefined && total > elapsed;
  const progress = hasRemainingTotal
    ? calculateProgress(activity, now)
    : undefined;
  const theme = ACTIVITY_THEMES[activity.type];
  const href = safeHttpUrl(activity.href);
  const imageUrl = safeHttpUrl(activity.imageUrl);

  return {
    active: true,
    avatarUrl,
    ...(activity.details === undefined
      ? {}
      : { details: cyrlat(activity.details) }),
    elapsed: formatTimeElapsed(elapsed),
    ...(href === undefined ? {} : { href }),
    icon: theme.icon,
    ...(imageUrl === undefined ? {} : { imageUrl }),
    label: historical
      ? `Was ${theme.label.replace(/ for$/, "").toLowerCase()} last`
      : theme.label,
    name: cyrlat(activity.name),
    progressMode: hasRemainingTotal ? "determinate" : "indeterminate",
    progressValue: progress ?? 0,
    showProgress: isCurrent,
    timeSuffix: historical ? "ago" : "elapsed",
    ...(hasRemainingTotal ? { total: formatTimeElapsed(total) } : {}),
  };
}
