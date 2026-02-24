import { config } from "@//lib/config";
import { getLanyardData } from "@//lib/lanyard";
import { Activity, LanyardData } from "@//lib/lanyard/types";
import { isAlphaNumeric } from "@//lib/utils";
import SocialLinks from "@//components/social-links";
import { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

interface ActivityMapPlaceholders extends Record<string, string> {
  details: string;
  emoji: string;
  state: string;
}

interface BaseActivityMap {
  map: string;
  icon?: LucideIcon;
  iconClass?: string;
}

interface ActivityMapWithAppId extends BaseActivityMap {
  application_id: string;
}

interface ActivityMapWithId extends BaseActivityMap {
  id: string;
}

type ActivityMap = ActivityMapWithId | ActivityMapWithAppId;

const ACTIVITY_TYPES: Record<number, string> = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  4: "Custom activity:",
  5: "Competing in",
};

const ACTIVITY_MAPS: ActivityMap[] = [
  {
    id: "custom",
    map: "{emoji} {state}",
  },
  {
    id: "spotify:1",
    map: "listening to {details} by {state}",
  },
];

function getActivityMap(activity: Activity): ActivityMap | undefined {
  return ACTIVITY_MAPS.find((map) =>
    "id" in map
      ? map.id === activity.id
      : map.application_id === activity.application_id,
  );
}

function getActivityText(activity: Activity): ReactNode {
  const map = getActivityMap(activity);

  if (!map) {
    const type = ACTIVITY_TYPES[activity.type] ?? "Doing";
    return `${type} ${activity.name}`.toLowerCase();
  }

  const emojiName = activity.emoji?.name ?? "";

  const placeholders: ActivityMapPlaceholders = {
    emoji: !isAlphaNumeric(emojiName) ? emojiName : "",
    details: activity.details ?? "",
    state: activity.state ?? "",
  };

  const markerValues: Record<string, string> = {};
  let markerIndex = 0;

  const markedText = map.map.replace(/\{(emoji|details|state)\}/g, (_, key) => {
    const value = placeholders[key as keyof ActivityMapPlaceholders];
    if (!value) return "";

    const marker = `__ph_${markerIndex++}__`;
    markerValues[marker] = value.toLowerCase();
    return marker;
  });

  const normalized = markedText.toLowerCase().replace(/\s+/g, " ").trim();
  const parts = normalized.split(/(__ph_\d+__)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part in markerValues) {
      return (
        <span key={`ph-${index}`} className="text-muted-foreground">
          {markerValues[part]}
        </span>
      );
    }

    return <span key={`txt-${index}`}>{part}</span>;
  });
}

function getStatusColor(status: LanyardData["discord_status"]): string {
  const map: Record<LanyardData["discord_status"], string> = {
    dnd: "border-rose-500",
    online: "border-emerald-400",
    idle: "border-amber-500",
    offline: "border-neutral-500",
  };

  return map[status];
}

function getAvatarUrl(lanyard: LanyardData | null): string {
  if (!lanyard) {
    return `https://cdn.discordapp.com/embed/avatars/${Number(config.discordUserId) % 5}.webp`;
  }

  return `https://cdn.discordapp.com/avatars/${config.discordUserId}/${lanyard.discord_user.avatar}.webp`;
}

function getDisplayName(lanyard: LanyardData | null): string {
  return lanyard?.discord_user.global_name ?? config.fallbackUser.global_name;
}

export default async function Home() {
  const lanyardRes = await getLanyardData();
  const lanyard = lanyardRes.ok ? lanyardRes.unwrap() : null;

  const activity = lanyard?.activities[0];

  return (
    <div className="flex min-h-screen items-center text-primary justify-center font-sans">
      <div className="bg-background/40 border p-4 rounded-xl">
        <div className="flex flex-row">
          <Image
            unoptimized
            src={getAvatarUrl(lanyard)}
            width={256}
            height={256}
            alt="User avatar"
            className={`w-24 rounded-lg drop-shadow-lg drop-shadow-background/50 ${lanyard ? `border-2 ${getStatusColor(lanyard.discord_status)}` : ""}`}
          />

          <div className="flex flex-col ml-4">
            <h2 className="text-2xl">{getDisplayName(lanyard)}</h2>

            <span className="inline-flex flex-row wrap-break-word w-70 leading-none mt-2 gap-1 text-muted-foreground/80">
              <span>
                {activity
                  ? getActivityText(activity)
                  : "probably doing nothing"}
              </span>
            </span>
          </div>
        </div>

        <SocialLinks />
      </div>
    </div>
  );
}
