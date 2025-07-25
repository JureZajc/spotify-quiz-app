import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co", // The official Spotify CDN for album art, etc.
        port: "",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com", // The Facebook CDN for profile pictures
        port: "",
        pathname: "/platform/profilepic/**",
      },
    ],
  },
};

export default nextConfig;
