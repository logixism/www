import { getActivityPresentation } from "../shared/activity-presentation";
import type { PresenceView } from "../shared/types";
import { safeHttpUrl } from "../shared/url";

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
  elapsedSuffix: Element;
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
    elapsedSuffix: required(root, "[data-elapsed-suffix]"),
    total: required(root, "[data-total]"),
    progress: required(root, "[data-progress]"),
  };
}

function updateOptionalUrl(
  element: Element,
  attribute: "href" | "src",
  value: string | undefined,
): void {
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

function updateActivityDetails(
  element: Element,
  details: string | undefined,
): void {
  element.textContent = details ?? "";
  element.toggleAttribute("hidden", !details);
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
    const view = getActivityPresentation(presence, tickNow);
    elements.elapsed.textContent = view.elapsed;
    elements.elapsedSuffix.textContent = view.timeSuffix;
    elements.total.textContent = view.total === undefined ? "" : `/ ${view.total}`;
    elements.total.toggleAttribute("hidden", view.total === undefined);
    elements.progress.setAttribute("mode", view.progressMode);
    elements.progress.setAttribute("value", String(view.progressValue));
    elements.progress.toggleAttribute("hidden", !view.showProgress);
  }

  function setPresence(next: PresenceView): void {
    presence = next;
    const view = getActivityPresentation(presence, now());
    updateAvatar(elements.avatar, view.avatarUrl);
    elements.activeState.toggleAttribute("hidden", !view.active);
    elements.idleState.toggleAttribute("hidden", view.active);
    elements.name.textContent = view.name;
    updateActivityDetails(elements.details, view.details);
    elements.icon.setAttribute("name", view.icon);
    elements.label.textContent = view.label;
    updateOptionalUrl(elements.link, "href", view.href);
    updateOptionalUrl(elements.artwork, "src", view.imageUrl);
    elements.elapsed.textContent = view.elapsed;
    elements.elapsedSuffix.textContent = view.timeSuffix;
    elements.total.textContent = view.total === undefined ? "" : `/ ${view.total}`;
    elements.total.toggleAttribute("hidden", view.total === undefined);
    elements.progress.setAttribute("mode", view.progressMode);
    elements.progress.setAttribute("value", String(view.progressValue));
    elements.progress.toggleAttribute("hidden", !view.showProgress);
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
