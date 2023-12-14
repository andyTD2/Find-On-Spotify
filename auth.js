import { CLIENT_ID } from "/config.js";
const REDIRECT_URI = "https://phbbhhccncpkopkloglnkamlafiepnge.chromiumapp.org/";


export function generateRandomString(length)
{
    const possibleValues = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomValues = crypto.getRandomValues(new Uint8Array(length));

    let randomString = "";
    for (let i = 0; i < length; ++i)
    {
        randomString += possibleValues[randomValues[i] % possibleValues.length];
    }
    return randomString;
}

export async function hashString(string)
{
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    return crypto.subtle.digest('SHA-256', data);
}


export function encodeToBase64(arrayBuffer)
{
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export async function getCodeVerifierAndChallenge()
{
    let verifier = generateRandomString(64);
    let challenge = encodeToBase64(await hashString(verifier));

    return {
        codeVerifier: verifier,
        codeChallenge: challenge
    };
}

export function getAuthUrl(authEndpoint, redirectURI, scope, clientId, codeChallenge)
{
    return `${authEndpoint}?response_type=code&client_id=${clientId}&code_challenge_method=S256&code_challenge=${codeChallenge}&scope=${scope}&redirect_uri=${redirectURI}`;
}

export async function authSpotify(authURL)
{
    let authResponse = undefined;
    try 
    {
        authResponse = await chrome.identity.launchWebAuthFlow(
        {
            url: authURL,
            interactive: true
        });
    } catch(error)
    {
        console.log(error);
    }

    return authResponse;
}

export async function validateAuth()
{
    let url = getAuthUrl("https://accounts.spotify.com/authorize", 
        REDIRECT_URI, 
        "playlist-modify-public+playlist-modify-private+user-library-modify",
        CLIENT_ID,
        await getCodeVerifierAndChallenge().codeChallenge
    );

    console.log(await authSpotify(url));
}