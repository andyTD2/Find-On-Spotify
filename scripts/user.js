export async function getCurrentUserPlaylists(accessToken)
{
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/me/playlists`, payload);
    console.log("Spotify response(playlists):", response);
    return await response.json();
}

export async function getCurrentUserSavedTracks(accessToken)
{
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/me/tracks`, payload);
    console.log("Spotify response(savedTracks):", response);
    return await response.json();
}