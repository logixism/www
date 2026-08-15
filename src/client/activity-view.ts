import { cyrlat } from "../shared/cyrlat";
import { ACTIVITY_THEMES } from "../shared/profile";
import { calculateProgress, formatTimeElapsed } from "../shared/time";
import type { Activity, PresenceView } from "../shared/types";

export type ActivityControllerOptions = {
  now?: () => number;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
};

export type ActivityController = {
  setPresence(next: PresenceView): void;
  tick(now?: number): void;
  dispose(): void;
};

type ActivityElements = {
  avatar: Element;
  link: Element;
  artwork: Element;
  activeState: Element;
  idleState: Element;
  name: Element;
  details: Element;
  icon: Element;
  label: Element;
  elapsed: Element;
  total: Element;
  progress: Element;
};

function required(root: ParentNode, selector: string): Element {
  const element = root.querySelector(selector);
  if (element === null) {
    throw new Error(`Missing required activity DOM hook: ${selector}`);
  }
  return element;
}

function activityElements(root: ParentNode): ActivityElements {
  return {
    avatar: required(root, "[data-avatar]"),
    link: required(root, "[data-activity-link]"),
    artwork: required(root, "[data-activity-artwork]"),
    activeState: required(root, "[data-active-state]"),
    idleState: required(root, "[data-idle-state]"),
    name: required(root, "[data-activity-name]"),
    details: required(root, "[data-activity-details]"),
    icon: required(root, "[data-activity-icon]"),
    label: required(root, "[data-activity-label]"),
    elapsed: required(root, "[data-elapsed]"),
    total: required(root, "[data-total]"),
    progress: required(root, "[data-progress]"),
  };
}

function safeHttpUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function updateOptionalUrl(element: Element, attribute: "href" | "src", value: string | undefined): void {
  element.removeAttribute(attribute);
  const url = safeHttpUrl(value);
  if (url === undefined) {
    element.setAttribute("hidden", "");
    return;
  }

  element.setAttribute(attribute, url);
  element.removeAttribute("hidden");
}

function updateAvatar(element: Element, value: string): void {
  element.removeAttribute("src");
  const url = safeHttpUrl(value);
  if (url !== undefined) element.setAttribute("src", url);
}

function updateActivityDetails(element: Element, details: string | undefined): void {
  element.textContent = details ? cyrlat(details) : "";
  element.toggleAttribute("hidden", !details);
}

function elapsedFor(activity: Activity, now: number): number {
  return Math.max(0, now - activity.startedAt);
}

function totalFor(activity: Activity): number | undefined {
  if (activity.endsAt === undefined) return undefined;
  return Math.max(0, activity.endsAt - activity.startedAt);
}

export function createActivityController(
  root: ParentNode,
  initialPresence: PresenceView,
  options: ActivityControllerOptions = {},
): ActivityController {
  const elements = activityElements(root);
  const now = options.now ?? Date.now;
  const setIntervalFn = options.setInterval ?? globalThis.setInterval;
  const clearIntervalFn = options.clearInterval ?? globalThis.clearInterval;
  let presence = initialPresence;
  let disposed = false;

  function tick(tickNow = now()): void {
    const activity = presence.activity;
    if (activity === undefined) {
      elements.elapsed.textContent = formatTimeElapsed(0);
      elements.total.setAttribute("hidden", "");
      elements.progress.setAttribute("mode", "indeterminate");
      elements.progress.setAttribute("value", "0");
      return;
    }

    const elapsed = elapsedFor(activity, tickNow);
    const total = totalFor(activity);
    const hasRemainingTotal = total !== undefined && total > elapsed;
    const progress = hasRemainingTotal ? calculateProgress(activity, tickNow) : undefined;

    elements.elapsed.textContent = formatTimeElapsed(elapsed);
    elements.total.textContent = `/ ${formatTimeElapsed(total ?? 0)}`;
    elements.total.toggleAttribute("hidden", !hasRemainingTotal);
    elements.progress.setAttribute("mode", hasRemainingTotal ? "determinate" : "indeterminate");
    elements.progress.setAttribute("value", String(progress ?? 0));
  }

  function setPresence(next: PresenceView): void {
    presence = next;
    updateAvatar(elements.avatar, presence.avatarUrl);

    const activity = presence.activity;
    if (activity === undefined) {
      elements.activeState.setAttribute("hidden", "");
      elements.idleState.removeAttribute("hidden");
      elements.name.textContent = "";
      updateActivityDetails(elements.details, undefined);
      updateOptionalUrl(elements.link, "href", undefined);
      updateOptionalUrl(elements.artwork, "src", undefined);
      tick();
      return;
    }

    elements.activeState.removeAttribute("hidden");
    elements.idleState.setAttribute("hidden", "");
    elements.name.textContent = cyrlat(activity.name);
    updateActivityDetails(elements.details, activity.details);
    elements.icon.setAttribute("name", ACTIVITY_THEMES[activity.type].icon);
    elements.label.textContent = ACTIVITY_THEMES[activity.type].label;
    updateOptionalUrl(elements.link, "href", activity.href);
    updateOptionalUrl(elements.artwork, "src", activity.imageUrl);
    tick();
  }

  const timer = setIntervalFn(tick, 1_000);
  setPresence(initialPresence);

  return {
    setPresence,
    tick,
    dispose() {
      if (disposed) return;
      disposed = true;
      clearIntervalFn(timer);
    },
  };
}
