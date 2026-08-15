import {
  ACTIVITY_THEMES,
  MONKEYTYPE_PROFILE_URL,
  PROJECTS,
  SOCIAL_LINKS,
} from "../shared/profile";
import { cyrlat } from "../shared/cyrlat";
import { calculateProgress, formatTimeElapsed } from "../shared/time";
import type { PresenceView } from "../shared/types";
import {
  escapeAttribute,
  escapeHtml,
  safeHttpUrl,
  serializeJsonForHtml,
} from "./safe-html";
import { getAverageImageColorServer } from "./image-color";

const SOCIAL_ICON_PATHS = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  roblox:
    "M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z",
  discord:
    "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
} as const;

export type RenderPageOptions = {
  presence: PresenceView;
  origin: string;
  nonce: string;
  socketUrl?: string | false;
  now?: number;
};

function optionalUrlAttribute(
  name: "href" | "src",
  value: string | undefined,
): string {
  const url = safeHttpUrl(value);
  return url === undefined ? "" : ` ${name}="${escapeAttribute(url)}"`;
}

function renderIntroCard(presence: PresenceView): string {
  return `<m3e-card class="card intro-card" variant="filled">
  <div slot="content" class="intro-content">
    <div class="intro-copy">
      <div class="intro-top">
        <m3e-shape name="4-leaf-clover" class="lead-shape">
          <div class="shape-center"><m3e-icon name="waving_hand" variant="rounded"></m3e-icon></div>
        </m3e-shape>
        <m3e-heading class="intro-heading" level="2" variant="display" size="large" emphasized>hi! i'm <span class="intro-name">logix.lol</span></m3e-heading>
      </div>
      <p class="intro-blurb"><a class="certified-link" href="${escapeAttribute(MONKEYTYPE_PROFILE_URL)}" target="_blank">Certified<m3e-icon name="arrow_outward" variant="rounded"></m3e-icon></a>professional keyboard user</p>
    </div>
    <m3e-shape name="7-sided-cookie" class="avatar-shape">
      <m3e-avatar><img data-avatar width="512" height="512"${optionalUrlAttribute("src", presence.avatarUrl)} alt="logix.lol"></m3e-avatar>
    </m3e-shape>
  </div>
</m3e-card>`;
}

function renderActivityCard(presence: PresenceView, now: number): string {
  const activity = presence.activity;
  const theme =
    activity === undefined
      ? ACTIVITY_THEMES.playing
      : ACTIVITY_THEMES[activity.type];
  const elapsed =
    activity === undefined ? 0 : Math.max(0, now - activity.startedAt);
  const total =
    activity?.endsAt === undefined
      ? undefined
      : Math.max(0, activity.endsAt - activity.startedAt);
  const hasRemainingTotal = total !== undefined && total > elapsed;
  const progress =
    activity === undefined ? undefined : calculateProgress(activity, now);
  const linkUrl = safeHttpUrl(activity?.href);
  const artworkUrl = safeHttpUrl(activity?.imageUrl);
  const activeHidden = activity === undefined ? " hidden" : "";
  const idleHidden = activity === undefined ? "" : " hidden";
  const detailsHidden = activity?.details === undefined ? " hidden" : "";
  const totalHidden = hasRemainingTotal ? "" : " hidden";
  const linkHidden = linkUrl === undefined ? " hidden" : "";
  const artworkHidden = artworkUrl === undefined ? " hidden" : "";
  const progressMode = hasRemainingTotal ? "determinate" : "indeterminate";
  const progressValue =
    hasRemainingTotal && progress !== undefined ? progress : 0;

  return `<m3e-card class="card activity-card" variant="filled">
  <div slot="content" class="activity-content">
    <div class="activity-header">
      <m3e-shape name="pill" class="lead-shape">
        <div class="shape-center"><m3e-icon name="bolt_boost" variant="rounded"></m3e-icon></div>
      </m3e-shape>
      <m3e-icon-button data-activity-link class="activity-link" variant="filled" target="_blank"${linkUrl === undefined ? "" : ` href="${escapeAttribute(linkUrl)}"`}${linkHidden}>
        <m3e-icon name="arrow_outward" variant="rounded"></m3e-icon>
      </m3e-icon-button>
    </div>
    <div class="ambient-glow" aria-hidden="true"></div>
    <div class="ambient-ring" aria-hidden="true"></div>
    <div class="ambient-ring outer" aria-hidden="true"></div>
    <img data-activity-artwork class="activity-artwork"${artworkUrl === undefined ? "" : ` src="${escapeAttribute(artworkUrl)}"`}${artworkHidden} alt="" aria-hidden="true">
    <div data-active-state class="active-content"${activeHidden}>
      <m3e-heading data-activity-name class="activity-name" level="3" variant="headline" size="large" emphasized>${escapeHtml(cyrlat(activity?.name ?? ""))}</m3e-heading>
      <m3e-heading data-activity-details level="4" variant="title" size="small"${detailsHidden}>${escapeHtml(cyrlat(activity?.details ?? ""))}</m3e-heading>
      <m3e-icon data-activity-icon class="activity-icon" name="${escapeAttribute(theme.icon)}" variant="rounded" aria-hidden="true"></m3e-icon>
      <div class="duration">
        <div class="duration-row">
          <div>
            <m3e-heading data-activity-label class="duration-label" level="4" variant="label" size="small">${escapeHtml(theme.label)}</m3e-heading>
            <div class="elapsed-row">
              <span data-elapsed class="duration-value">${formatTimeElapsed(elapsed)}</span>
              <span data-total class="duration-value"${totalHidden}>/ ${formatTimeElapsed(total ?? 0)}</span>
              <span class="elapsed-suffix">elapsed</span>
            </div>
          </div>
        </div>
        <m3e-linear-progress-indicator data-progress class="activity-progress" variant="wavy" mode="${progressMode}" value="${progressValue}"></m3e-linear-progress-indicator>
      </div>
    </div>
    <div data-idle-state class="idle-copy"${idleHidden}>
      <m3e-heading level="3" variant="headline" size="large" emphasized>taking a breather</m3e-heading>
      <m3e-heading class="subtitle" level="4" variant="title" size="small">not doing anything right now :p</m3e-heading>
      <m3e-icon class="activity-icon" name="coffee" variant="rounded" aria-hidden="true"></m3e-icon>
    </div>
  </div>
</m3e-card>`;
}

function rootUrl(origin: string): string {
  try {
    return safeHttpUrl(new URL("/", origin).href) ?? "/";
  } catch {
    return "/";
  }
}

function renderProjectsCard(origin: string): string {
  const projectItems = PROJECTS.map((project, index) => {
    const href = index === 0 ? rootUrl(origin) : project.href;
    return `<m3e-list-action href="${escapeAttribute(href)}" target="_blank">
  <m3e-icon name="${escapeAttribute(project.icon)}" variant="rounded" slot="leading"></m3e-icon>
  ${escapeHtml(project.label)}
  <span slot="supporting-text">${escapeHtml(project.description)}</span>
</m3e-list-action>`;
  }).join("\n");

  return `<m3e-card class="card projects-card" variant="filled">
  <div slot="content" class="card-content">
    <div class="section-top">
      <m3e-shape name="slanted" class="lead-shape">
        <div class="shape-center"><m3e-icon name="code" variant="rounded"></m3e-icon></div>
      </m3e-shape>
      <m3e-heading class="section-heading" level="2" variant="headline" size="medium" emphasized>stuff I worked on</m3e-heading>
    </div>
    <m3e-action-list class="action-list" variant="segmented" aria-label="Things">
      ${projectItems}
    </m3e-action-list>
  </div>
</m3e-card>`;
}

function renderSocialsCard(): string {
  const socialItems = SOCIAL_LINKS.map(
    (
      link,
    ) => `<m3e-list-action href="${escapeAttribute(link.href)}" target="_blank">
  <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" slot="leading"><path d="${SOCIAL_ICON_PATHS[link.icon]}"></path></svg>
  ${escapeHtml(link.label)}
  <span slot="supporting-text">@${escapeHtml(link.handle)}</span>
</m3e-list-action>`,
  ).join("\n");

  return `<m3e-card class="card socials-card" variant="filled">
  <div slot="content" class="card-content">
    <div class="section-top">
      <m3e-shape name="6-sided-cookie" class="lead-shape">
        <div class="shape-center"><m3e-icon name="taunt" variant="rounded"></m3e-icon></div>
      </m3e-shape>
      <m3e-heading class="section-heading" level="2" variant="headline" size="medium" emphasized>find me elsewhere</m3e-heading>
    </div>
    <m3e-action-list class="action-list" variant="segmented" aria-label="find me elsewhere">
      ${socialItems}
    </m3e-action-list>
  </div>
</m3e-card>`;
}

export async function renderPage({
  presence,
  origin,
  nonce,
  socketUrl,
  now = Date.now(),
}: RenderPageOptions): Promise<string> {
  const avgImageColor = await getAverageImageColorServer(presence.avatarUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="my cool website">
    <title>logix</title>

    <link rel="modulepreload" href="/assets/client.js">
    <link rel="stylesheet" href="/assets/styles.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap" rel="stylesheet">
    <link href="/assets/styles.css" rel="stylesheet">

    <script type="module" src="/assets/client.js"></script>
  </head>
  <body>
    <m3e-theme class="page-theme" color="${avgImageColor}" scheme="auto" motion="expressive">
      <main class="site-main">
        <div class="card-grid">
          ${renderIntroCard(presence)}
          ${renderActivityCard(presence, now)}
          ${renderProjectsCard(origin)}
          ${renderSocialsCard()}
        </div>
      </main>
    </m3e-theme>
    <script id="initial-presence" type="application/json" nonce="${escapeAttribute(nonce)}">${serializeJsonForHtml({ presence, socketUrl })}</script>
  </body>
</html>`;
}
