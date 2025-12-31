// /app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// --- Type Definitions ---
interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  preview_url: string | null; // Added to check for playable previews
}

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface Genre {
  name: string;
  count: number;
}

type TopItemsData = {
  tracks: Track[];
  artists: Artist[];
  genres: Genre[];
};

type TimeRange = "short_term" | "medium_term" | "long_term";
type ActiveTab = "tracks" | "artists" | "genres";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<TopItemsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("tracks");
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");

  useEffect(() => {
    // If not authenticated, redirect to home page
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `/api/spotify/top-items?time_range=${timeRange}`,
            {
              credentials: "include",
            }
          );
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch data");
          }
          const result: TopItemsData = await res.json();
          setData(result);
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [status, timeRange, router]); // Re-fetch when timeRange or auth status changes

  const renderContent = () => {
    if (loading)
      return (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      );
    if (error)
      return <p className="text-center py-8 text-red-500">Error: {error}</p>;
    if (!data)
      return (
        <p className="text-center py-8 text-muted-foreground">No data found.</p>
      );

    switch (activeTab) {
      case "tracks":
        return (
          <ol className="space-y-3">
            {data.tracks.map((track, index) => (
              <li
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span className="font-bold min-w-[30px] text-right text-muted-foreground">
                  {index + 1}.
                </span>
                <Image
                  src={track.album.images[0].url}
                  alt={track.name}
                  width={50}
                  height={50}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{track.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
                {track.preview_url && (
                  <div
                    title="This song has a playable preview"
                    className="flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                  </div>
                )}
              </li>
            ))}
          </ol>
        );
      case "artists":
        return (
          <ol className="space-y-3">
            {data.artists.map((artist, index) => (
              <li
                key={artist.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span className="font-bold min-w-[30px] text-right text-muted-foreground">
                  {index + 1}.
                </span>
                <Image
                  src={artist.images[0]?.url || "/placeholder.png"}
                  alt={artist.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="font-semibold">{artist.name}</div>
              </li>
            ))}
          </ol>
        );
      case "genres":
        return (
          <ol className="space-y-3">
            {data.genres.map((genre, index) => (
              <li
                key={genre.name}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors capitalize"
              >
                <span className="font-bold min-w-[30px] text-right text-muted-foreground">
                  {index + 1}.
                </span>
                <span>{genre.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {genre.count}
                </Badge>
              </li>
            ))}
          </ol>
        );
      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800">
          <h1 className="text-2xl md:text-3xl font-bold">Your Spotify Stats</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {session?.user?.name && (
              <span className="text-sm md:text-base text-muted-foreground">
                Welcome, {session.user.name}
              </span>
            )}
            <Button onClick={() => signOut()} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as ActiveTab)}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="artists">Artists</TabsTrigger>
                <TabsTrigger value="genres">Genres</TabsTrigger>
              </TabsList>

              {/* Time Range Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  onClick={() => setTimeRange("short_term")}
                  variant={timeRange === "short_term" ? "default" : "outline"}
                  size="sm"
                >
                  Last 4 Weeks
                </Button>
                <Button
                  onClick={() => setTimeRange("medium_term")}
                  variant={timeRange === "medium_term" ? "default" : "outline"}
                  size="sm"
                >
                  Last 6 Months
                </Button>
                <Button
                  onClick={() => setTimeRange("long_term")}
                  variant={timeRange === "long_term" ? "default" : "outline"}
                  size="sm"
                >
                  All Time
                </Button>
              </div>

              <TabsContent value="tracks">{renderContent()}</TabsContent>
              <TabsContent value="artists">{renderContent()}</TabsContent>
              <TabsContent value="genres">{renderContent()}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href={`/quiz?time_range=${timeRange}`}>
              🎵 Start the Quiz!
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/statistics">📊 View Statistics</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
