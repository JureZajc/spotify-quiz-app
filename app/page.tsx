// /app/page.tsx
"use client"; // This page needs to be a client component

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        textAlign: "center",
        marginTop: "50px",
      }}
    >
      <h1>Spotify Quiz App</h1>

      {!session && (
        <>
          <p>Please sign in to continue.</p>
          <button
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
            onClick={() => signIn("spotify")}
          >
            Sign in with Spotify
          </button>
        </>
      )}

      {session && (
        <>
          <p>Welcome, {session.user?.name}!</p>
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="User profile picture"
              width={100}
              height={100}
              style={{ borderRadius: "50%" }}
            />
          )}
          <br />
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 25px",
              backgroundColor: "#1DB954", // Spotify Green
              color: "white",
              textDecoration: "none",
              borderRadius: "50px",
              fontWeight: "bold",
            }}
          >
            View Your Stats
          </Link>
          <br />
          <button
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              marginTop: "20px",
              backgroundColor: "transparent",
              border: "1px solid #ccc",
            }}
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      )}
    </main>
  );
}
