import { describe, expect, test } from "bun:test";
import { createIgdbGameArtworkEnricher } from "../../src/server/igdb";
import type { PresenceView } from "../../src/shared/types";

const playing: PresenceView = {
  avatarUrl: "https://example.com/avatar.webp",
  activity: {
    type: "playing",
    name: "Risk of Rain® 2",
    startedAt: 1_000,
  },
};

describe("IGDB game artwork enrichment", () => {
  test("uses a normalized exact match and caches its artwork", async () => {
    let searches = 0;
    const enrich = createIgdbGameArtworkEnricher({
      async searchGames() {
        searches += 1;
        return [
          { name: "Risk of Rain Returns", cover: { image_id: "wrong" } },
          {
            name: "Risk of Rain 2",
            cover: { image_id: "right" },
            external_games: [
              {
                external_game_source: { name: "Steam" },
                uid: "632360",
                url: "https://store.steampowered.com/app/632360",
              },
            ],
          },
        ];
      },
      buildArtworkUrl: (imageId) =>
        `https://images.igdb.com/${imageId}.jpg`,
    });

    const first = await enrich(playing);
    const second = await enrich(playing);

    expect(first.activity?.imageUrl).toBe(
      "https://images.igdb.com/right.jpg",
    );
    expect(second.activity?.imageUrl).toBe(
      "https://images.igdb.com/right.jpg",
    );
    expect(first.activity?.href).toBe(
      "https://store.steampowered.com/app/632360",
    );
    expect(searches).toBe(1);
  });

  test("builds a Steam href from its external-game UID", async () => {
    const enrich = createIgdbGameArtworkEnricher({
      async searchGames() {
        return [
          {
            name: "Risk of Rain 2",
            external_games: [
              {
                external_game_source: { name: "Steam" },
                uid: "632360",
              },
            ],
          },
        ];
      },
      buildArtworkUrl: () =>
        "https://images.igdb.com/unreachable.jpg",
    });

    expect((await enrich(playing)).activity?.href).toBe(
      "https://store.steampowered.com/app/632360",
    );
  });

  test("does not add an href without a Steam external game", async () => {
    const enrich = createIgdbGameArtworkEnricher({
      async searchGames() {
        return [
          {
            name: "Risk of Rain 2",
            external_games: [
              {
                external_game_source: { name: "Epic Games Store" },
                url: "https://store.epicgames.com/p/risk-of-rain-2",
              },
            ],
          },
        ];
      },
      buildArtworkUrl: () =>
        "https://images.igdb.com/unreachable.jpg",
    });

    expect((await enrich(playing)).activity?.href).toBeUndefined();
  });

  test("does not query IGDB for non-playing activities", async () => {
    const listening: PresenceView = {
      ...playing,
      activity: { ...playing.activity!, type: "listening" },
    };
    const enrich = createIgdbGameArtworkEnricher({
      async searchGames() {
        throw new Error("search should not run");
      },
      buildArtworkUrl: () =>
        "https://images.igdb.com/unreachable.jpg",
    });

    expect(await enrich(listening)).toBe(listening);
  });

  test("preserves the activity and does not cache failed requests", async () => {
    let searches = 0;
    const enrich = createIgdbGameArtworkEnricher({
      async searchGames() {
        searches += 1;
        throw new Error("IGDB unavailable");
      },
      buildArtworkUrl: () =>
        "https://images.igdb.com/unreachable.jpg",
    });

    expect(await enrich(playing)).toBe(playing);
    expect(await enrich(playing)).toBe(playing);
    expect(searches).toBe(2);
  });
});
