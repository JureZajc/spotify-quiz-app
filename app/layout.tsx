// /app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers"; // Import your new provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spotify Quiz App",
  description: "Test your music knowledge!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers> {/* Wrap children */}
      </body>
    </html>
  );
}
