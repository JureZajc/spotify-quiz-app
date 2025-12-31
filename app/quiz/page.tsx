"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Type Definitions ---
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

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  preview_url: string | null;
}

interface PreviewResult {
  preview_url: string;
  track: string;
  artist: string;
}

type GameState = "loading" | "ready" | "playing" | "finished" | "error";

export default function QuizPage() {
  const router = useRouter();
  const [questions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [inswered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<string>("medium_term");

  // --- Fetch quiz data on mount ---
  useEffect(() => {
    // Get time range from URL params if provided
    const urlParams = new URLSearchParams(window.location.search);
    const timeRangeParam = urlParams.get("time_range");
    let currentTimeRange = "medium_term"; // default

    if (
      timeRangeParam &&
      ["short_term", "medium_term", "long_term"].includes(timeRangeParam)
    ) {
      currentTimeRange = timeRangeParam;
      setSelectedTimeRange(timeRangeParam);
    }

    const fetchTopTracks = async () => {
      try {
        console.log(`Fetching tracks for time range: ${currentTimeRange}`);
        const res = await fetch(
          `/api/spotify/top-items?time_range=${currentTimeRange}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          console.log(
            `Fetched ${data.tracks?.length || 0} tracks for ${currentTimeRange}`
          );
          setTopTracks(data.tracks || []);
        }
      } catch {
        // Silent fail for track fetching
      }
    };

    fetchTopTracks();
  }, [router]); // Remove selectedTimeRange from dependencies to avoid double fetch

  // --- Preview Checker UI ---
  function PreviewChecker() {
    const [song, setSong] = useState("");
    const [artist, setArtist] = useState("");
    const [result, setResult] = useState<PreviewResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setResult(null);
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/preview-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song, artist }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data);
        } else {
          setError(data.error || "No preview found.");
        }
      } catch {
        setError("Error checking preview.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Check Spotify Preview for Any Song
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="text"
              placeholder="Song Title"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
            >
              {loading ? "Checking..." : "Check Preview"}
            </Button>
          </form>
          {result && (
            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <b>Track:</b> {result.track} <b>Artist:</b> {result.artist}
              </div>
              <audio src={result.preview_url} controls className="w-full" />
            </div>
          )}
          {error && <div className="text-red-500 mt-3">{error}</div>}
        </CardContent>
      </Card>
    );
  }

  // --- Free Text Quiz State ---
  const [userArtist, setUserArtist] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [freeTextFeedback, setFreeTextFeedback] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [loadingNextTrack, setLoadingNextTrack] = useState(false);
  const [usedTrackIds, setUsedTrackIds] = useState<Set<string>>(new Set());

  // Helper: Normalize string for comparison
  function normalize(str: string) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ");
  }
  // Helper: Simple typo-tolerant check (Levenshtein distance <= 2)
  function isClose(a: string, b: string) {
    if (normalize(a) === normalize(b)) return true;
    // Levenshtein distance
    const m = a.length,
      n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[m][n] <= 2;
  }

  // Helper: Get a random track with preview
  const getRandomTrackWithPreview =
    useCallback(async (): Promise<SpotifyTrack | null> => {
      // First, try tracks that already have preview_url
      const tracksWithPreview = topTracks.filter(
        (t) => t.preview_url && !usedTrackIds.has(t.id)
      );
      if (tracksWithPreview.length > 0) {
        const randomTrack =
          tracksWithPreview[
            Math.floor(Math.random() * tracksWithPreview.length)
          ];
        return randomTrack;
      }

      // If no tracks with preview_url, try to find one using spotify-preview-finder
      const tracksWithoutPreview = topTracks.filter(
        (t) => !t.preview_url && !usedTrackIds.has(t.id)
      );
      for (const track of tracksWithoutPreview) {
        try {
          const res = await fetch("/api/preview-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              song: track.name,
              artist: track.artists.map((a) => a.name).join(", "),
            }),
          });
          if (res.ok) {
            const previewData = await res.json();
            return { ...track, preview_url: previewData.preview_url };
          }
        } catch {
          continue;
        }
      }
      return null; // No more tracks with previews
    }, [topTracks, usedTrackIds]);

  // Load first track when topTracks is available
  useEffect(() => {
    if (topTracks.length > 0 && !currentTrack) {
      const loadFirstTrack = async () => {
        setLoadingNextTrack(true);
        const track = await getRandomTrackWithPreview();
        if (track) {
          setCurrentTrack(track);
          setUsedTrackIds((prev) => new Set(prev).add(track.id));
        }
        setLoadingNextTrack(false);
      };
      loadFirstTrack();
    }
  }, [topTracks, currentTrack, getRandomTrackWithPreview]);

  const [freeTextScore, setFreeTextScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [maxQuestions] = useState(3); // Limit to 3 songs for testing
  const [quizTracks, setQuizTracks] = useState<
    {
      trackId: string;
      trackName: string;
      artist: string;
      correct: boolean;
      userAnswer: { artist: string; title: string };
    }[]
  >([]); // Store tracks and answers for saving

  function handleFreeTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTrack) return;

    setFreeTextFeedback(null);
    const correctArtist = currentTrack.artists.map((a) => a.name).join(", ");
    const correctTitle = currentTrack.name;
    const artistCorrect = isClose(userArtist, correctArtist);
    const titleCorrect = isClose(userTitle, correctTitle);
    const isCorrect = artistCorrect && titleCorrect;

    setTotalQuestions((prev) => prev + 1);

    // Store track result for saving later
    const trackResult = {
      trackId: currentTrack.id,
      trackName: currentTrack.name,
      artist: correctArtist,
      correct: isCorrect,
      userAnswer: {
        artist: userArtist,
        title: userTitle,
      },
    };
    setQuizTracks((prev) => [...prev, trackResult]);

    if (isCorrect) {
      setFreeTextFeedback("✅ Correct!");
      setFreeTextScore((s) => s + 1);
    } else {
      setFreeTextFeedback(
        `❌ Wrong. Artist: ${correctArtist}, Title: ${correctTitle}`
      );
    }

    // Check if quiz should end (3 questions completed)
    const newTotalQuestions = totalQuestions + 1;
    if (newTotalQuestions >= maxQuestions) {
      // Save result to database with track details
      setTimeout(async () => {
        try {
          const finalScore = isCorrect ? freeTextScore + 1 : freeTextScore;
          const finalTracks = [...quizTracks, trackResult];
          await fetch("/api/quiz/save-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: finalScore,
              totalQuestions: newTotalQuestions,
              timeRange: selectedTimeRange, // Use the actual selected time range
              tracks: finalTracks,
            }),
            credentials: "include",
          });
        } catch (error) {
          console.error("Failed to save quiz result:", error);
        }
        setCurrentTrack(null); // This will trigger the quiz finished state
      }, 1800);
      return;
    }

    // Load next track after showing feedback
    setTimeout(async () => {
      setUserArtist("");
      setUserTitle("");
      setFreeTextFeedback(null);
      setLoadingNextTrack(true);

      const nextTrack = await getRandomTrackWithPreview();
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        setUsedTrackIds((prev) => new Set(prev).add(nextTrack.id));
      } else {
        // No more tracks available
        setCurrentTrack(null);
      }
      setLoadingNextTrack(false);
    }, 1800);
  }

  function handleFreeTextRestart() {
    setFreeTextScore(0);
    setTotalQuestions(0);
    setUserArtist("");
    setUserTitle("");
    setFreeTextFeedback(null);
    setUsedTrackIds(new Set());
    setCurrentTrack(null);
    setQuizTracks([]); // Reset tracks array
    // Will trigger useEffect to load first track
  }

  // --- Rendering States ---
  // Show quiz finished if no more tracks
  if (totalQuestions > 0 && !currentTrack && !loadingNextTrack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <PreviewChecker />
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-center">
                Quiz Finished!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-xl md:text-2xl font-semibold">
                Your Final Score: {freeTextScore} / {totalQuestions}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleFreeTextRestart}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Play Again
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show current track quiz or loading
  if (currentTrack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <PreviewChecker />
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl text-center">
                Type the Artist and Title
              </CardTitle>
              <p className="text-center text-muted-foreground mt-2">
                Question {totalQuestions + 1} - Score: {freeTextScore}/
                {totalQuestions}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio
                src={currentTrack.preview_url || undefined}
                controls
                autoPlay
                loop
                className="w-full"
              />
              <form onSubmit={handleFreeTextSubmit} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Artist"
                  value={userArtist}
                  onChange={(e) => setUserArtist(e.target.value)}
                  autoFocus
                  required
                  disabled={!!freeTextFeedback}
                />
                <Input
                  type="text"
                  placeholder="Title"
                  value={userTitle}
                  onChange={(e) => setUserTitle(e.target.value)}
                  required
                  disabled={!!freeTextFeedback}
                />
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!!freeTextFeedback}
                >
                  Submit
                </Button>
              </form>
              {freeTextFeedback && (
                <div className="font-bold text-center text-lg">
                  {freeTextFeedback}
                </div>
              )}
              {loadingNextTrack && (
                <div className="text-center text-muted-foreground">
                  Loading next track...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading first track
  if (loadingNextTrack || topTracks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <PreviewChecker />
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-2xl font-bold">Loading Quiz...</h2>
              <p className="text-muted-foreground">
                Finding a track with preview...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No tracks available
  if (gameState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <PreviewChecker />
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl md:text-2xl">
                Quiz Unavailable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p>Failed to load quiz. Do you have enough listening history?</p>
              <p className="text-muted-foreground text-sm">
                You can still check for Spotify previews above.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <PreviewChecker />
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl md:text-2xl">
              No Playable Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Couldn&apos;t find any of your top tracks with previews.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
