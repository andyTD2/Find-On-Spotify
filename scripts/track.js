/*
    Removes characters from a query that don't play nice with spotify's seach api
    @param query: the query to sanitize
    @return the sanitized query
*/
export function sanitizeQuery(query)
{
    return query.replace(/[{}\[\]]/g, '');
}


/*
    Submits a search query to spotify's api
    @param query: the search query
    @param accessToken: the user's access token required by spotify
    @return an object containing data related to the results including
    an array of 20 tracks that best match the search query. Returns undefined
    on fail.
*/
export async function searchTrack(query, accessToken)
{
    query = sanitizeQuery(query);
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, payload);

    if(response.ok)
    {
        return await response.json();
    }
    const error = (await response.json()).error;
    console.log(`Search query failed. Received error code ${error.status} - ${error.message}`);
    return undefined;
}

/*
    Add a specified track to a user's specified playlist
    @param playlistId the id of the playlist to add to
    @param trackUri a uri that specifies the type and id of a spotify track (https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids)
    @param accessToken: the user's access token
    @return a snapshot id; undefined on failure
*/
export async function addTrackToPlaylist(playlistId, trackUri, accessToken)
{
    const payload = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        },
        body: `{"uris": ["${trackUri}"]}`
    };

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, payload);
    if(response.ok)
    {
        return await response.json();
    }
    const error = (await response.json()).error;
    console.log(`Add to playlist failed. Received error code ${error.status} - ${error.message}`);
    return undefined;
}
