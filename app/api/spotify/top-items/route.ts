// /app/api/spotify/top-items/route.ts

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth"; // Make sure this path is correct

// This is the key change! It forces the route to be dynamic.
export const dynamic = "force-dynamic";

// A more specific type for Spotify Artists to improve type safety
interface SpotifyArtist {
  genres: string[];
  // ... other artist properties you might use
}

// Helper function to make requests to the Spotify API
async function spotifyRequest(endpoint: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    // Important: Tell Next.js not to cache the fetch request itself
    cache: "no-store",
  });

  if (!response.ok) {
    // Log the error for better debugging
    console.error("Spotify API Error:", response.status, await response.text());
    throw new Error(`Spotify API request failed: ${response.statusText}`);
  }
  return response.json();
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      // This is the check that was failing
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const time_range = searchParams.get("time_range") || "medium_term";

    // Fetch top tracks and artists in parallel for efficiency
    const [topTracks, topArtists] = await Promise.all([
      spotifyRequest(
        `/me/top/tracks?time_range=${time_range}&limit=50`,
        session.accessToken
      ),
      spotifyRequest(
        `/me/top/artists?time_range=${time_range}&limit=50`,
        session.accessToken
      ),
    ]);

    // Calculate top genres from the list of top artists
    const genreCounts: { [key: string]: number } = {};
    topArtists.items.forEach((artist: SpotifyArtist) => {
      artist.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Sort genres by count
    const sortedGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      tracks: topTracks.items,
      artists: topArtists.items,
      genres: sortedGenres,
    });
  } catch (error) {
    // Log the error on the server for debugging
    console.error("Error in /api/spotify/top-items:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
