import { CLIENT_ID } from "/config.js";
const REDIRECT_URI = "https://phbbhhccncpkopkloglnkamlafiepnge.chromiumapp.org/";


/*
    Generates a random string that can be used as a code verifier for pkce authorization.
    @param length: length of the random string to generate
    @return: a random string
*/
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



/*
    Hashes the string using SHA-256 hash function
    @param string: the string to hash
    @return: a promise that is fulfilled with an array buffer representing the hashed string 
*/
export async function hashString(string)
{
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    return crypto.subtle.digest('SHA-256', data);
}



/*
    Encodes an array buffer to a base64 string
    @param arrayBuffer: an array buffer representing the string to encode
    @return: a base64 encoded string
*/
export function encodeToBase64(arrayBuffer)
{
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}



/*
    Generates a code verifier and the corresponding code challenge
    @return: a promise fulfilled with an object containing both the verifier and challenge
*/
export async function getCodeVerifierAndChallenge()
{
    let verifier = generateRandomString(64);
    let challenge = encodeToBase64(await hashString(verifier));

    return {
        codeVerifier: verifier,
        codeChallenge: challenge
    };
}



/*
    Generates an spotify authorization url from the given parameters
    @param authEndpoint: endpoint of the authorization service
    @param redirectURI: the URI to redirect to upon completion of authorization
    @param scope: scope of authorization required by spotify
    @param clientId: client id of the application registered on spotify
    @param codeChallenge: a code challenge that is required by pkce(can be generated with getCodeVerifierAndChallenge())
    @return: the authorization url as a string
*/
export function getAuthUrl(scope, codeChallenge)
{
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&code_challenge_method=S256&code_challenge=${codeChallenge}&scope=${scope}&redirect_uri=${REDIRECT_URI}`;
}



/*
    Redirects the user to the authorization service provided by spotify and waits for a response from spotify's authorization.
    @param authURL: the URL of the authorization endpoint, must have required params attached
    @return: Upon success returns spotify's response w/ authorization code. Upon failure returns undefined and logs error in console
*/
export async function getAuthorization(authURL)
{
    let authResponse = undefined;
    try 
    {   //we use chrome's built in launchWebAuthFlow function to redirect the user and wait for a spotify response
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



/*
    Retrieves an authorization code from a URL.
    @param authCodeURL: the URL containing the authorization code
    @return: Upon success returns the authorization code. Upon fail returns undefined
*/
export function validateAuthCode(authCodeURL)
{
    if(!authCodeURL) return undefined;

    const urlParams = new URL(authCodeURL).searchParams;
    if(!urlParams.has("code"))
        return undefined;

    return urlParams.get("code");
}



/*
    Exchanges an authorization code for an access token.
    @param authCode: the authorization code
    @param codeVerifier: the code verifier that corresponds to the earlier authorization request's code challenge
    @return: a json response containing the access token, token type, expiration time in seconds, scope of authorization, and refresh token 
*/
export async function exchangeAuthCodeForToken(authCode, codeVerifier)
{
    let urlParams = `client_id=${CLIENT_ID}&grant_type=authorization_code&code=${authCode}&code_verifier=${codeVerifier}&redirect_uri=${REDIRECT_URI}`;
    const payload = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams
    };

    const response = await fetch("https://accounts.spotify.com/api/token", payload);
    return await response.json();
}



/*
    Redirect the user to spotify's auth service and retrieve an access token
    @return: a json response containing the access token, token type, expiration time in seconds, scope of authorization, and refresh token 
*/
export async function getAccessToken()
{
    let codeVerifierAndChallenge = await getCodeVerifierAndChallenge();
    let url = getAuthUrl("playlist-modify-public+playlist-modify-private+user-library-modify", codeVerifierAndChallenge.codeChallenge);
    let authCode = validateAuthCode(await getAuthorization(url));
    if(!authCode) return undefined;

    return await exchangeAuthCodeForToken(authCode, codeVerifierAndChallenge.codeVerifier);
}



/*
    Acquires a new access token given a refresh token
    @param refreshToken: a refresh token provided by an earlier call to spotify's token api
    @return: a json response containing the new access token, token type, expiration time in seconds, scope of authorization, and new refresh token
*/
export async function refreshAccessToken(refreshToken)
{
    let urlParams = `client_id=${CLIENT_ID}&grant_type=refresh_token&refresh_token=${refreshToken}`;
    const payload = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams
    };

    const response = await fetch("https://accounts.spotify.com/api/token", payload);
    return await response.json();
}



/*
    Saves information about the access token to chrome's local storage
    @param accessTokenData: an object containing the access token, token type, expiration time in seconds, scope of authorization, and refresh token
    return: none
*/
export async function saveAccessTokenData(accessTokenData)
{
    try {
        await chrome.storage.local.set({"accessTokenData": accessTokenData});
    }
    catch(error)
    {
        console.log("Failed to save access token:", error);
    }
}



/*
    Retrieves information about the access token from chrome's local storage
    @return: an object containing the access token, token type, expiration time in seconds, scope of authorization, and refresh token
*/
export async function loadAccessTokenData()
{
    let accessTokenData = undefined;
    try {
        accessTokenData = await chrome.storage.local.get(["accessTokenData"]);
    }
    catch(error)
    {
        console.log("Failed to retrive access token data:", error);
        return accessTokenData;
    }
    return accessTokenData;
}