// /app/page.tsx
"use client"; // This page needs to be a client component

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Spotify Quiz App
          </CardTitle>
          <CardDescription className="text-base md:text-lg">
            Test your knowledge of your own music taste!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session && (
            <>
              <p className="text-muted-foreground">
                Please sign in to continue.
              </p>
              <Button
                onClick={() => signIn("spotify")}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Sign in with Spotify
              </Button>
            </>
          )}

          {session && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-lg">
                  Welcome,{" "}
                  <span className="font-semibold">{session.user?.name}</span>!
                </p>
                {session.user?.image && (
                  <Avatar className="w-24 h-24 border-4 border-green-600">
                    <AvatarImage src={session.user.image} alt="User profile" />
                    <AvatarFallback>
                      {session.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Link href="/dashboard">View Your Stats</Link>
                </Button>
                <Button onClick={() => signOut()} variant="outline" size="lg">
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
