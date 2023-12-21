import * as auth from "/scripts/auth.js"

export async function searchTrack(query)
{
    const payload = {
        headers: {
            "Authorization": "Bearer " + (await auth.loadAccessTokenData()).access_token
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, payload);
    console.log("Spotify response:", response);
    return await response.json();
}