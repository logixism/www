import {
  IconType,
  SiDiscord,
  SiGithub,
  SiLastdotfm,
  SiRoblox,
} from "@icons-pack/react-simple-icons";

interface BaseSocialLink {
  icon: IconType;
  name: string;
}

export interface SocialLinkWithCopy extends BaseSocialLink {
  textToCopy: string;
}

export interface SocialLinkWithHref extends BaseSocialLink {
  href: string;
}

export type SocialLink = SocialLinkWithCopy | SocialLinkWithHref;

export interface AppConfig {
  discordUserId: string;
  fallbackUser: {
    global_name: string;
  };
  socialLinks: SocialLink[];
}

export const config = {
  discordUserId: "804066391614423061",
  fallbackUser: {
    global_name: "logix",
  },
  socialLinks: [
    {
      name: "Discord",
      icon: SiDiscord,
      textToCopy: "logix.lol",
    },
    {
      name: "Github",
      icon: SiGithub,
      href: "https://github.com/logixism",
    },
    {
      name: "last.fm",
      icon: SiLastdotfm,
      textToCopy: "https://www.last.fm/user/logixism",
    },
    {
      name: "Roblox",
      icon: SiRoblox,
      textToCopy: "https://roblox.com/users/2947401001/profile",
    },
  ],
} as const satisfies AppConfig;
