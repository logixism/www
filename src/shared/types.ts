export type ActivityType = "playing" | "listening" | "watching" | "coding";

export type Activity = {
  type: ActivityType;
  name: string;
  details?: string;
  href?: string;
  imageUrl?: string;
  startedAt: number;
  endsAt?: number;
};

export type PresenceView = {
  avatarUrl: string;
  activity?: Activity;
  lastActivity?: Activity;
  activityGoneAt?: number;
};
export type ActivityTheme = { label: string; icon: string };
export type Project = {
  icon: string;
  label: string;
  description: string;
  href: string;
};
export type SocialLink = {
  icon: "github" | "roblox" | "discord";
  label: string;
  href: string;
  handle: string;
};
