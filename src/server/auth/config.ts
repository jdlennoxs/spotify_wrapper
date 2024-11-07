import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Session, User, type DefaultSession, type NextAuthConfig } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

import { db } from "@/server/db";
import { eq, and } from 'drizzle-orm';
import {
  accounts,
  sessions,
  users,
} from "@/server/db/schema";
import { env } from "@/env";

const scopes = "user-read-email,user-top-read";

import SpotifyWebApi from "spotify-web-api-node";


/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      account: string;
      token: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    SpotifyProvider({
      authorization:
        `https://accounts.spotify.com/authorize?scope=${scopes}`,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions
  }),
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      try {
        const account = await db.query.users.findFirst({
          where: eq(users.id, user.id),
          with: {
            accounts: true,
          },
        });

        if (!account?.accounts[0]) {
          return session;
        }

        const sessionResponse: Session = {
          ...session,
          user: {
            ...session.user,
            id: user.id ?? '',
            account: account.accounts[0].providerAccountId,
            token: account.accounts[0].access_token ?? '',
          },
        };

        const expiresIn = Math.floor((account.accounts[0].expires_at ?? 0) - (Date.now() / 1000));
        if (expiresIn < 100) {

          // const spotifyApi = new SpotifyWebApi({
          //   clientId: env.AUTH_SPOTIFY_ID || "",
          //   clientSecret: env.AUTH_SPOTIFY_SECRET || "",
          // });
          // spotifyApi.setAccessToken(account?.accounts[0]?.access_token ?? "");
          // spotifyApi.setRefreshToken(account?.accounts[0]?.refresh_token ?? "");
          // const { body: refreshedToken } = await spotifyApi.refreshAccessToken();
          // console.log(refreshedToken, "refreshedToken")

          const request = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${env.AUTH_SPOTIFY_ID}:${env.AUTH_SPOTIFY_SECRET}`
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: account.accounts[0].refresh_token ?? "",
            }),
            cache: "no-cache",
          });

          if (request.ok) {
            const response = await request.json();
            const { access_token, expires_in, refresh_token } = response;
            const timestamp = Math.floor(Date.now() / 1000 + expires_in);

            await db.update(accounts)
              .set({
                access_token,
                expires_at: timestamp,
                refresh_token: refresh_token ?? account.accounts[0].refresh_token,
              })
              .where(
                and(
                  eq(accounts.provider, "spotify"),
                  eq(accounts.providerAccountId, account.accounts[0].providerAccountId)
                )
              );

            sessionResponse.user.token = access_token;
          } else {
            console.error(`Failed to refresh token: ${request.status} ${request.statusText}`);
          }
        }

        return sessionResponse;
      } catch (error) {
        console.error(error);
        return session;
      }
    },
  }
}
