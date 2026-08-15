import type { PresenceView } from "../shared/types";

export type GameSearchResult = {
  name?: string;
  cover?: { image_id?: string };
  external_games?: Array<{
    external_game_source?: { name?: string };
    uid?: string;
    url?: string;
  }>;
};

type GameMetadata = {
  imageUrl?: string;
  href?: string;
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

function getSteamHref(game: GameSearchResult | undefined): string | undefined {
  const steam = game?.external_games?.find(
    (externalGame) =>
      externalGame.external_game_source?.name?.toLocaleLowerCase("en") ===
      "steam",
  );
  const url = steam?.url?.trim();
  if (url) return url;

  const uid = steam?.uid?.trim();
  return uid !== undefined && /^\d+$/.test(uid)
    ? `https://store.steampowered.com/app/${uid}`
    : undefined;
}

export function createIgdbGameArtworkEnricher({
  searchGames,
  buildArtworkUrl,
  onError,
}: IgdbGameArtworkEnricherOptions): (
  presence: PresenceView,
) => Promise<PresenceView> {
  const metadata = new Map<string, Promise<GameMetadata>>();

  return async (presence) => {
    const activity = presence.activity;
    if (activity?.type !== "playing") return presence;

    const key = normalizeGameName(activity.name);
    let pending = metadata.get(key);
    if (pending === undefined) {
      pending = searchGames(activity.name)
        .then((games) => {
          const match = games.find(
            (game) =>
              game.name !== undefined && normalizeGameName(game.name) === key,
          );
          const imageId = match?.cover?.image_id;
          return {
            imageUrl:
              imageId === undefined ? undefined : buildArtworkUrl(imageId),
            href: getSteamHref(match),
          };
        })
        .catch((error: unknown) => {
          metadata.delete(key);
          onError?.(error);
          return {};
        });
      metadata.set(key, pending);
    }

    const { imageUrl, href } = await pending;
    if (imageUrl === undefined && href === undefined) return presence;
    return {
      ...presence,
      activity: {
        ...activity,
        ...(imageUrl === undefined ? {} : { imageUrl }),
        ...(href === undefined ? {} : { href }),
      },
    };
  };
}
