import type { PresenceView } from "../shared/types";

export type GameSearchResult = {
  name?: string;
  cover?: { image_id?: string };
};

export type IgdbGameArtworkEnricherOptions = {
  searchGames: (name: string) => Promise<readonly GameSearchResult[]>;
  buildArtworkUrl: (imageId: string) => string;
  onError?: (error: unknown) => void;
};

function normalizeGameName(name: string): string {
  return name
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createIgdbGameArtworkEnricher({
  searchGames,
  buildArtworkUrl,
  onError,
}: IgdbGameArtworkEnricherOptions): (
  presence: PresenceView,
) => Promise<PresenceView> {
  const artwork = new Map<string, Promise<string | undefined>>();

  return async (presence) => {
    const activity = presence.activity;
    if (activity?.type !== "playing") return presence;

    const key = normalizeGameName(activity.name);
    let pending = artwork.get(key);
    if (pending === undefined) {
      pending = searchGames(activity.name)
        .then((games) => {
          const match = games.find(
            (game) =>
              game.name !== undefined && normalizeGameName(game.name) === key,
          );
          const imageId = match?.cover?.image_id;
          return imageId === undefined ? undefined : buildArtworkUrl(imageId);
        })
        .catch((error: unknown) => {
          artwork.delete(key);
          onError?.(error);
          return undefined;
        });
      artwork.set(key, pending);
    }

    const imageUrl = await pending;
    if (imageUrl === undefined) return presence;
    return { ...presence, activity: { ...activity, imageUrl } };
  };
}
