declare module 'spotify-preview-finder' {
  interface SpotifyPreviewResult {
    name: string;
    artistName: string;
    albumName: string;
    trackId: string;
    previewUrls: string[];
  }

  interface SpotifyPreviewResponse {
    success: boolean;
    results: SpotifyPreviewResult[];
    searchQuery: string;
    error?: string;
  }

  function spotifyPreviewFinder(
    track: string,
    artist?: string,
    limit?: number
  ): Promise<SpotifyPreviewResponse>;

  export default spotifyPreviewFinder;
}
