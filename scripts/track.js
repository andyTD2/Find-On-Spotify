export function sanitizeQuery(query)
{
    return query.replace(/[{}\[\]]/g, '');
}

export async function searchTrack(query, accessToken)
{
    query = sanitizeQuery(query);
    console.log("sanitized query:", query);
    const payload = {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    };
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, payload);
    console.log("Spotify response:", response);
    return await response.json();
}