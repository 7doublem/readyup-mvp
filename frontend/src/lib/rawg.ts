// RAWG Video Games Database API integration
// Docs: https://rawg.io/apidocs — free tier, 20k requests/month
// Used to pull game images and metadata for event cards

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = "https://api.rawg.io/api";

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  released: string | null;
  metacritic: number | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
  short_screenshots: { id: number; image: string }[];
}

interface RawgSearchResponse {
  count: number;
  results: RawgGame[];
}

// In-memory cache to avoid redundant API calls for the same game
const cache = new Map<string, RawgGame | null>();

// Search RAWG for a game by name and return the top result
export async function searchGame(gameName: string): Promise<RawgGame | null> {
  if (!API_KEY) {
    console.warn("RAWG API key not set. Add VITE_RAWG_API_KEY to .env.local");
    return null;
  }

  // Normalise the key so "Apex Legends" and "apex legends" share the cache
  const cacheKey = gameName.trim().toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      search: gameName,
      page_size: "1",
    });

    const res = await fetch(`${BASE_URL}/games?${params}`);
    if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

    const data: RawgSearchResponse = await res.json();
    const game = data.results[0] ?? null;

    cache.set(cacheKey, game);
    return game;
  } catch (error) {
    console.error("RAWG search failed:", error);
    cache.set(cacheKey, null);
    return null;
  }
}

// Fetch a batch of games at once (used by the event feed)
export async function searchGames(
  gameNames: string[]
): Promise<Map<string, RawgGame>> {
  const unique = [...new Set(gameNames.map((n) => n.trim().toLowerCase()))];
  const results = new Map<string, RawgGame>();

  // Fire all lookups in parallel
  await Promise.all(
    unique.map(async (name) => {
      const game = await searchGame(name);
      if (game) results.set(name, game);
    })
  );

  return results;
}

// Returns just the background image URL for a game, or a fallback
export async function getGameImage(gameName: string): Promise<string | null> {
  const game = await searchGame(gameName);
  return game?.background_image ?? null;
}
