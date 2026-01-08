import { describe, expect, it } from "vitest";

import { normalizeRawgItem } from "@/features/catalog/normalize/rawg.normalize";
import { normalizeTmdb } from "@/features/catalog/normalize/tmdb.normalize";
import type { RawgGameLike } from "@/features/catalog/providers/types";

describe("normalizeRawgItem", () => {
  it("builds unified game item", () => {
    const raw: RawgGameLike = {
      id: 123,
      name: "Halo",
      released: "2001-11-15",
      background_image: "https://media.rawg.io/media/games/halo.jpg",
      genres: [{ name: "Action" }, { name: "Shooter" }],
    };

    const item = normalizeRawgItem(raw);

    expect(item.key).toBe("rawg-123");
    expect(item.type).toBe("game");
    expect(item.title).toBe("Halo");
    expect(item.year).toBe(2001);
    expect(item.posterUrl).toBe("https://media.rawg.io/media/resize/640/-/games/halo.jpg");
    expect(item.genres).toEqual(["Action", "Shooter"]);
  });

  it("prefers additional background when main image is missing", () => {
    const raw: RawgGameLike = {
      id: 7,
      name: "Stardew Valley",
      background_image: null,
      background_image_additional: "https://img/extra.jpg",
      genres: [],
    };

    const item = normalizeRawgItem(raw);

    expect(item.posterUrl).toBe("https://img/extra.jpg");
  });

  it("upgrades RAWG images to HQ with resize/640/-", () => {
    const raw: RawgGameLike = {
      id: 8,
      name: "Celeste",
      background_image: null,
      background_image_additional: null,
      short_screenshots: [{ image: "https://media.rawg.io/media/screenshots/288/abc.jpg" }],
      genres: [],
    };

    const item = normalizeRawgItem(raw);

    expect(item.posterUrl).toBe("https://media.rawg.io/media/resize/640/-/screenshots/288/abc.jpg");
  });

  it("does not double-resize already resized URLs", () => {
    const raw: RawgGameLike = {
      id: 9,
      name: "Already Resized",
      background_image: "https://media.rawg.io/media/resize/640/-/games/abc.jpg",
      genres: [],
    };

    const item = normalizeRawgItem(raw);

    expect(item.posterUrl).toBe("https://media.rawg.io/media/resize/640/-/games/abc.jpg");
  });

  describe("rating logic", () => {
    it("converts metacritic 0-100 to 0-10", () => {
      const raw: RawgGameLike = {
        id: 10,
        name: "Test Game",
        background_image: "foo.jpg",
        metacritic: 80,
      };
      expect(normalizeRawgItem(raw).rating).toBe(8);
    });

    it("handles metacritic 0 correctly (no falsy bug)", () => {
      const raw: RawgGameLike = {
        id: 11,
        name: "Test Game",
        background_image: "foo.jpg",
        metacritic: 0,
        rating: 4.5, // Should stay ignored because metacritic exists
      };
      expect(normalizeRawgItem(raw).rating).toBe(0);
    });

    it("falls back to rating * 2 if metacritic is missing", () => {
      const raw: RawgGameLike = {
        id: 12,
        name: "Test Game",
        background_image: "foo.jpg",
        rating: 4.3,
      };
      expect(normalizeRawgItem(raw).rating).toBe(8.6);
    });

    it("handles rating 0 correctly (no null)", () => {
      const raw: RawgGameLike = {
        id: 13,
        name: "Test Game",
        background_image: "foo.jpg",
        rating: 0,
      };
      expect(normalizeRawgItem(raw).rating).toBe(0);
    });
  });
});

describe("normalizeTmdbItem", () => {
  it("builds unified movie item", () => {
    const raw = {
      id: 42,
      title: "The Matrix",
      release_date: "1999-03-31",
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
      genres: [{ name: "Sci-Fi" }],
      overview: "A hacker learns the world is a simulation.",
    };

    const item = normalizeTmdb("movie", raw);

    expect(item.key).toBe("tmdb-42");
    expect(item.type).toBe("movie");
    expect(item.title).toBe("The Matrix");
    expect(item.year).toBe(1999);
    expect(item.posterUrl).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
    expect(item.backdropUrl).toBe("https://image.tmdb.org/t/p/w1280/backdrop.jpg");
    expect(item.genres).toEqual(["Sci-Fi"]);
    expect(item.summary).toBe("A hacker learns the world is a simulation.");
  });
});
