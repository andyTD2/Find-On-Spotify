/*
    Retrieves the current linked user's playlists
    @param accessToken: the current user's spotify access token
    @return an object containing data related to the user's playlists, including
    an array containing each playlist's data. Undefined on failure
*/
export async function getCurrentUserPlaylists(accessToken)
{
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/me/playlists`, payload);
    if(response.ok)
    {
        return await response.json();
    }
    const error = (await response.json()).error;
    console.log(`Playlist lookup failed. Received error code ${error.status} - ${error.message}`);
    return undefined;
}


/*
    Gets the current user's saved tracks.
    @param accessToken: the current user's spotify access token
    @return an object containing data related to the user's saved tracks, including
    an array containing each track's data. Undefined on failure
*/
export async function getCurrentUserSavedTracks(accessToken)
{
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/me/tracks`, payload);
    if(response.ok)
    {
        return await response.json();
    }
    const error = (await response.json()).error;
    console.log(`Saved tracks lookup failed. Received error code ${error.status} - ${error.message}`);
    return undefined;
}