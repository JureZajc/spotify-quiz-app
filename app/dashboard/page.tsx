// /app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [status, timeRange, router]); // Re-fetch when timeRange or auth status changes

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!data) return <p>No data found.</p>;

    switch (activeTab) {
      case "tracks":
        return (
          <ol>
            {data.tracks.map((track, index) => (
              <li
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "10px 0",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    minWidth: "25px",
                    textAlign: "right",
                  }}
                >
                  {index + 1}.
                </span>
                <Image
                  src={track.album.images[0].url}
                  alt={track.name}
                  width={50}
                  height={50}
                />
                <div style={{ flexGrow: 1 }}>
                  <strong>{track.name}</strong>
                  <div style={{ color: "#888" }}>
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
                {/* --- Playable Song Icon --- */}
                {track.preview_url && (
                  <div title="This song has a playable preview">
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
                      style={{ color: "#1DB954" }} // Spotify Green
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
          <ol>
            {data.artists.map((artist, index) => (
              <li
                key={artist.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "10px 0",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    minWidth: "25px",
                    textAlign: "right",
                  }}
                >
                  {index + 1}.
                </span>
                <Image
                  src={artist.images[0]?.url || "/placeholder.png"}
                  alt={artist.name}
                  width={50}
                  height={50}
                  style={{ borderRadius: "50%" }}
                />
                <strong>{artist.name}</strong>
              </li>
            ))}
          </ol>
        );
      case "genres":
        return (
          <ol>
            {data.genres.map((genre, index) => (
              <li
                key={genre.name}
                style={{ margin: "10px 0", textTransform: "capitalize" }}
              >
                <span style={{ marginRight: "15px", fontWeight: "bold" }}>
                  {index + 1}.
                </span>
                {genre.name}
              </li>
            ))}
          </ol>
        );
      default:
        return null;
    }
  };

  const buttonStyle = (tabName: ActiveTab) => ({
    padding: "10px 20px",
    cursor: "pointer",
    border: "none",
    backgroundColor: activeTab === tabName ? "#1DB954" : "#eee",
    color: activeTab === tabName ? "white" : "black",
    borderRadius: "5px",
  });

  const timeRangeButtonStyle = (range: TimeRange) => ({
    padding: "8px 15px",
    cursor: "pointer",
    border: "1px solid #ccc",
    backgroundColor: timeRange === range ? "#333" : "white",
    color: timeRange === range ? "white" : "black",
    borderRadius: "5px",
  });

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Your Spotify Stats</h1>
        <div>
          {session?.user?.name && (
            <span style={{ marginRight: "15px" }}>
              Welcome, {session.user.name}
            </span>
          )}
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Top Menu for Tracks/Artists/Genres */}
        <div style={{ margin: "20px 0", display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("tracks")}
            style={buttonStyle("tracks")}
          >
            Top Tracks
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            style={buttonStyle("artists")}
          >
            Top Artists
          </button>
          <button
            onClick={() => setActiveTab("genres")}
            style={buttonStyle("genres")}
          >
            Top Genres
          </button>
        </div>

        {/* Time Range Selector */}
        <div style={{ margin: "20px 0", display: "flex", gap: "10px" }}>
          <button
            onClick={() => setTimeRange("short_term")}
            style={timeRangeButtonStyle("short_term")}
          >
            Last 4 Weeks
          </button>
          <button
            onClick={() => setTimeRange("medium_term")}
            style={timeRangeButtonStyle("medium_term")}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setTimeRange("long_term")}
            style={timeRangeButtonStyle("long_term")}
          >
            All Time
          </button>
        </div>

        {renderContent()}

        {/* Link to the Quiz */}
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link
            href="/quiz"
            style={{
              padding: "15px 30px",
              backgroundColor: "#1DB954",
              color: "white",
              textDecoration: "none",
              borderRadius: "50px",
              fontSize: "1.2em",
              fontWeight: "bold",
              marginRight: "15px",
            }}
          >
            Start the Quiz!
          </Link>
          <Link
            href="/statistics"
            style={{
              padding: "15px 30px",
              backgroundColor: "#333",
              color: "white",
              textDecoration: "none",
              borderRadius: "50px",
              fontSize: "1.2em",
              fontWeight: "bold",
            }}
          >
            📊 View Statistics
          </Link>
        </div>
      </main>
    </div>
  );
}
