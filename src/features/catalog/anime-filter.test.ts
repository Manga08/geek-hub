import { describe, it, expect } from "vitest";
import { filterAnimeCandidates } from "./service";
import type { TmdbTv } from "./providers/types";

describe("Catalog: Anime Filter Heuristic", () => {
  const makeItem = (
    id: number,
    name: string,
    genres: number[],
    lang: string,
    countries: string[]
  ): TmdbTv => ({
    id,
    name,
    genre_ids: genres,
    original_language: lang,
    origin_country: countries,
    overview: "Description",
  });

  it("STRICT: Includes Japanese Animation (genre 16 + lang 'ja')", () => {
    const input = [
      makeItem(1, "Anime 1", [16, 18], "ja", ["JP"]),
      makeItem(2, "Anime 2", [16], "ja", ["US"]), // valid by lang
    ];
    const result = filterAnimeCandidates(input);
    expect(result).toHaveLength(2);
  });

  it("STRICT: Includes Japanese Animation (genre 16 + country 'JP')", () => {
    const input = [
      makeItem(1, "Anime Co-Prod", [16], "en", ["JP", "US"]),
    ];
    const result = filterAnimeCandidates(input);
    expect(result).toHaveLength(1);
  });

  it("Excludes Japanese TV that is not Animation", () => {
    const input = [
      makeItem(1, "J-Drama", [18], "ja", ["JP"]), // Drama, no animation
    ];
    const result = filterAnimeCandidates(input);
    expect(result).toHaveLength(0);
  });

  it("FALLBACK: Includes non-JP animation if strict matches are few (<5)", () => {
    const input = [
      makeItem(1, "Western Cartoon", [16], "en", ["US"]),
      makeItem(2, "Another Cartoon", [16], "fr", ["FR"]),
    ];
    // Strict matches = 0. Should fall back to genre 16.
    const result = filterAnimeCandidates(input);
    expect(result).toHaveLength(2);
    expect(result.map(i => i.name)).toContain("Western Cartoon");
  });

  it("STRICT MODE: If many (>5) JP anime exist, exclude western cartoons", () => {
    const input: TmdbTv[] = [];
    // Add 5 Real Animes
    for (let i = 0; i < 5; i++) {
      input.push(makeItem(i, `Anime ${i}`, [16], "ja", ["JP"]));
    }
    // Add 1 Western Cartoon
    input.push(makeItem(99, "SpongeBob", [16], "en", ["US"]));

    const result = filterAnimeCandidates(input);

    // Should restrict to the 5 animes
    expect(result).toHaveLength(5);
    expect(result.find(i => i.name === "SpongeBob")).toBeUndefined();
  });
});
