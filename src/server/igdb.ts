import { IGDBClient, buildImageUrl } from "@api-wrappers/igdb-wrapper";
import type { PresenceView } from "../shared/types";
import type { PresenceEnricher } from "./presence/service";

type GameSearchResult = {
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

export type IgdbActivityEnricherOptions = {
  clientId: string;
  clientSecret: string;
  onError?: (error: unknown) => void;
};

const GAME_FIELDS =
  "name, cover.image_id, external_games.external_game_source.name, external_games.uid, external_games.url";

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

export function createIgdbActivityEnricher({
  clientId,
  clientSecret,
  onError,
}: IgdbActivityEnricherOptions): PresenceEnricher {
  const client = new IGDBClient({ clientId, clientSecret });
  const metadata = new Map<string, Promise<GameMetadata>>();

  const getMetadata = (name: string): Promise<GameMetadata> => {
    const key = normalizeGameName(name);
    let pending = metadata.get(key);
    if (pending === undefined) {
      pending = client.games
        .search(name)
        .fields(GAME_FIELDS)
        .limit(10)
        .execute()
        .then((games) => {
          const match = games.find(
            (game) =>
              game.name !== undefined && normalizeGameName(game.name) === key,
          );
          const imageId = match?.cover?.image_id;
          return {
            imageUrl:
              imageId === undefined
                ? undefined
                : buildImageUrl(imageId, {
                    size: "cover_big",
                    retina: true,
                  }),
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

    return pending;
  };

  return {
    async enrich(presence: PresenceView): Promise<PresenceView> {
      const activity = presence.activity;
      if (activity?.type !== "playing") return presence;

      const { imageUrl, href } = await getMetadata(activity.name);
      if (imageUrl === undefined && href === undefined) return presence;
      return {
        ...presence,
        activity: {
          ...activity,
          ...(imageUrl === undefined ? {} : { imageUrl }),
          ...(href === undefined ? {} : { href }),
        },
      };
    },

    dispose() {
      return client.dispose();
    },
  };
}
