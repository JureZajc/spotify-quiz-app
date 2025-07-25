// /types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"]; // Keep the default user properties
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `session` callback. */
  interface JWT {
    accessToken?: string;
    spotifyId?: string;
  }
}
