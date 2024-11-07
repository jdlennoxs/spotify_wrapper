import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { env } from "@/env";
import { Session } from 'next-auth';

export const sdk = SpotifyApi.withClientCredentials(env.AUTH_SPOTIFY_ID, env.AUTH_SPOTIFY_SECRET);

export const getUserSpotifyApi = async (session: Session) => {
    return SpotifyApi.withAccessToken(env.AUTH_SPOTIFY_ID, {
        access_token: session.user.token,
    } as AccessToken);
}

export const getTopArtist = async (session: Session) => {
    try {
        const userSdk = await getUserSpotifyApi(session);
        const artists = await userSdk.currentUser.topItems('artists', 'medium_term', 10);
        return artists.items;
    } catch (e) {
        console.log(e)
    }
}