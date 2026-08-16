import type { ActivityTheme, ActivityType, Project, SocialLink } from "./types";

export const MONKEYTYPE_PROFILE_URL = "https://monkeytype.com/profile/logixlol";
export const DISCORD_USER_ID = "804066391614423061";
export const LANYARD_SOCKET_URL = "wss://api.lanyard.rest/socket";
export const FALLBACK_AVATAR_URL =
  "https://api.lanyard.rest/804066391614423061.webp";

export const PROJECTS: Project[] = [
  {
    icon: "home",
    href: "https://github.com/logixism/www",
    label: "This site",
    description: "Small personal page",
  },
  {
    icon: "trending_up",
    href: "https://jbvalues.com/",
    description: "The #1 value list for Roblox Jailbreak",
    label: "JBValues",
  },
  {
    icon: "chat",
    href: "https://github.com/logixism/bloxchat",
    description: "Roblox chat client that bypasses age verification",
    label: "BloxChat",
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    icon: "steam",
    label: "Steam",
    href: "https://store.steampowered.com/wishlist/id/logixwtf/?sort=dateadded&st=15839068991916890400",
    handle: "/id/logixwtf",
  },
  {
    icon: "roblox",
    label: "Roblox",
    href: "https://www.roblox.com/users/2947401001/profile",
    handle: "logixism",
  },
  {
    icon: "discord",
    label: "Discord",
    href: "https://discord.com/users/804066391614423061",
    handle: "logix.lol",
  },
];

export const ACTIVITY_THEMES: Record<ActivityType, ActivityTheme> = {
  playing: {
    label: "Playing for",
    icon: "stadia_controller",
  },
  listening: {
    label: "Listening for",
    icon: "graphic_eq",
  },
  watching: {
    label: "Watching for",
    icon: "movie",
  },
  coding: {
    label: "Working for",
    icon: "code",
  },
};
