import { NextRequest, NextResponse } from "next/server";
import spotifyPreviewFinder from "spotify-preview-finder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { song, artist } = await req.json();
    if (!song) {
      return new NextResponse(JSON.stringify({ error: "Missing song name." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Use the new API: (song, artist, limit)
    const result = await spotifyPreviewFinder(song, artist || undefined, 2);
    if (result.success && result.results.length > 0) {
      // Find the first result with at least one preview URL
      const found = result.results.find(r => r.previewUrls && r.previewUrls.length > 0);
      if (found) {
        return NextResponse.json({
          preview_url: found.previewUrls[0],
          track: found.name,
          artist: found.artistName,
          album: found.albumName,
          trackId: found.trackId,
          all_preview_urls: found.previewUrls,
          searchQuery: result.searchQuery
        });
      } else {
        return new NextResponse(JSON.stringify({ error: "No preview found for this song/artist." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      return new NextResponse(JSON.stringify({ error: result.error || "No results found." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
