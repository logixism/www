import "@m3e/web/avatar";
import "@m3e/web/card";
import "@m3e/web/heading";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import "@m3e/web/list";
import "@m3e/web/progress-indicator";
import "@m3e/web/shape";
import "@m3e/web/theme";
import "@m3e/icons/rounded/arrow_outward";
import "@m3e/icons/rounded/bolt_boost";
import "@m3e/icons/rounded/chat";
import "@m3e/icons/rounded/code";
import "@m3e/icons/rounded/coffee";
import "@m3e/icons/rounded/graphic_eq";
import "@m3e/icons/rounded/home";
import "@m3e/icons/rounded/movie";
import "@m3e/icons/rounded/stadia_controller";
import "@m3e/icons/rounded/taunt";
import "@m3e/icons/rounded/trending_up";
import "@m3e/icons/rounded/waving_hand";

import { createActivityController } from "./client/activity-view";
import { getAverageImageColor } from "./client/image-color";
import { connectToLanyard } from "./shared/lanyard-socket";
import { DISCORD_USER_ID } from "./shared/profile";
import type { PresenceView } from "./shared/types";

type BootstrapState = {
  presence: PresenceView;
  socketUrl?: unknown;
};

const bootstrap =
  document.querySelector<HTMLScriptElement>("#initial-presence");
if (bootstrap === null)
  throw new Error("Missing initial presence bootstrap data");

const state = JSON.parse(bootstrap.textContent ?? "") as BootstrapState;
const controller = createActivityController(document, state.presence);
const theme = document.querySelector("m3e-theme");

getAverageImageColor(state.presence.avatarUrl)
  .then((color) => theme?.setAttribute("color", color))
  .catch((error: unknown) =>
    console.error("Could not derive avatar theme color", error),
  );

let disposeSocket: (() => void) | undefined;
if (typeof state.socketUrl === "string") {
  try {
    disposeSocket = connectToLanyard({
      userId: DISCORD_USER_ID,
      url: state.socketUrl,
      onPresence: controller.setPresence,
      onError: (error) => console.error("Lanyard socket error", error),
    });
  } catch (error) {
    console.error("Could not connect to Lanyard socket", error);
  }
}

window.addEventListener(
  "pagehide",
  () => {
    controller.dispose();
    disposeSocket?.();
  },
  { once: true },
);
