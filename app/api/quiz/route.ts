// /app/api/quiz/route.ts
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// TypeScript interfaces
interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  artists: SpotifyArtist[];
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

interface QuizOption {
  id: string;
  name: string;
  artist: string;
}

interface QuizQuestion {
  preview_url: string;
  correct_answer_id: string;
  options: QuizOption[];
}

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // 1. Fetch a larger list of the user's top tracks
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch top tracks from Spotify");
    }

    const topTracksData: SpotifyTopTracksResponse = await response.json();

    // 2. Filter for tracks that have a 30-second preview_url
    const playableTracks = topTracksData.items.filter(
      (track: SpotifyTrack) => track.preview_url
    );

    if (playableTracks.length < 10) {
      // Not enough playable tracks to create a full quiz
      return NextResponse.json(
        { error: "Not enough playable top tracks to generate a quiz." },
        { status: 400 }
      );
    }

    // 3. Shuffle the tracks and select 10 for our questions
    const shuffledTracks = shuffle(playableTracks);
    const quizTracks = shuffledTracks.slice(0, 10);

    // 4. For each quiz track, create a question object with multiple-choice options
    const quizQuestions: QuizQuestion[] = quizTracks.map(
      (correctTrack: SpotifyTrack) => {
        // Get 3 other random tracks to be the wrong answers
        const wrongAnswers = shuffledTracks
          .filter((track: SpotifyTrack) => track.id !== correctTrack.id) // Exclude the correct answer
          .slice(0, 3)
          .map((track: SpotifyTrack) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: SpotifyArtist) => a.name).join(", "),
          }));

        const options = shuffle([
          // The correct answer
          {
            id: correctTrack.id,
            name: correctTrack.name,
            artist: correctTrack.artists
              .map((a: SpotifyArtist) => a.name)
              .join(", "),
          },
          // The 3 wrong answers
          ...wrongAnswers,
        ]);

        return {
          preview_url: correctTrack.preview_url!,
          correct_answer_id: correctTrack.id,
          options: options,
        };
      }
    );

    return NextResponse.json(quizQuestions);
  } catch (error: unknown) {
    console.error("Error in /api/quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
