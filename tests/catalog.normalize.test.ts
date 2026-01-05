import { describe, expect, it } from "vitest";

import { normalizeRawgItem } from "@/features/catalog/normalize/rawg.normalize";
import { normalizeTmdb } from "@/features/catalog/normalize/tmdb.normalize";

describe("normalizeRawgItem", () => {
  it("builds unified game item", () => {
    const raw = {
      id: 123,
      name: "Halo",
      released: "2001-11-15",
      background_image: "https://img/halo.jpg",
      genres: [{ name: "Action" }, { name: "Shooter" }],
    };

    const item = normalizeRawgItem(raw);

    expect(item.key).toBe("rawg-123");
    expect(item.type).toBe("game");
    expect(item.title).toBe("Halo");
    expect(item.year).toBe(2001);
    expect(item.posterUrl).toBe("https://img/halo.jpg");
    expect(item.genres).toEqual(["Action", "Shooter"]);
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
