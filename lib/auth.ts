// /lib/auth.ts
import { NextAuthOptions, Account, User as AuthUser, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import dbConnect from "./mongodb";
import UserModel from "../models/User";

// Extended session interface to include our custom properties
interface ExtendedSession extends Session {
  accessToken?: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const scopes = ["user-read-email", "user-top-read", "user-read-private"].join(
  ","
);

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: `https://accounts.spotify.com/authorize?scope=${scopes}`,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: AuthUser;
      account?: Account | null;
    }): Promise<JWT> {
      if (account && user) {
        await dbConnect();
        const userInDb = await UserModel.findOne({
          spotifyId: account.providerAccountId,
        });

        if (userInDb) {
          userInDb.refreshToken = account.refresh_token!;
          await userInDb.save();
        } else {
          await UserModel.create({
            name: user.name,
            email: user.email,
            spotifyId: account.providerAccountId,
            refreshToken: account.refresh_token,
            image: user.image,
          });
        }
        token.accessToken = account.access_token;
        token.spotifyId = account.providerAccountId;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: JWT;
    }): Promise<ExtendedSession> {
      session.accessToken = token.accessToken as string;
      session.user.id = token.spotifyId as string;
      return session;
    },
  },
};
