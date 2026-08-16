import { createActivityController } from "./activity-controller";
import { getAverageImageColor } from "./image-color";
import { connectToPresenceEvents } from "./presence-events";
import type { PresenceView } from "../shared/types";

type BootstrapState = {
  presence: PresenceView;
};

class PresenceControllerElement extends HTMLElement {
  #dispose: (() => void) | undefined;

  connectedCallback(): void {
    if (this.#dispose !== undefined) return;

    try {
      const rawState = this.dataset.state;
      if (rawState === undefined) {
        throw new Error("Missing presence bootstrap data");
      }

      const state = JSON.parse(rawState) as BootstrapState;
      const activity = createActivityController(this, state.presence);
      const theme = this.querySelector("m3e-theme");
      let avatarUrl = state.presence.avatarUrl;
      let colorRequest = 0;

      const updateTheme = (nextAvatarUrl: string): void => {
        const request = ++colorRequest;
        getAverageImageColor(nextAvatarUrl)
          .then((color) => {
            if (request === colorRequest) theme?.setAttribute("color", color);
          })
          .catch((error: unknown) => {
            console.error("Could not derive avatar theme color", error);
          });
      };

      const disconnect = connectToPresenceEvents({
        onPresence(presence) {
          activity.setPresence(presence);
          if (presence.avatarUrl !== avatarUrl) {
            avatarUrl = presence.avatarUrl;
            updateTheme(avatarUrl);
          }
        },
        onError(error) {
          console.error("Could not apply live presence update", error);
        },
      });

      this.#dispose = () => {
        colorRequest += 1;
        activity.dispose();
        disconnect();
      };
    } catch (error) {
      console.error("Could not initialize live presence", error);
    }
  }

  disconnectedCallback(): void {
    this.#dispose?.();
    this.#dispose = undefined;
  }
}

if (!customElements.get("presence-controller")) {
  customElements.define("presence-controller", PresenceControllerElement);
}
