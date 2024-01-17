import * as auth from "/scripts/auth.js";
import {saveData, deleteData} from "/scripts/utils/storage.js";


export class User
{
    constructor(accessTokenData = undefined)
    {
        this.accessTokenData = accessTokenData;
    }

    getAccessToken()
    {
        return this.accessTokenData;
    }

    setAccessToken(newAccessTokenData)
    {
        this.accessTokenData = newAccessTokenData;
    }

    /*
        Get authorization from user and acquire a new token. Saves token to local storage.
    */
    async fetchAuthorization()
    {
        this.setAccessToken(await auth.getAccessToken());
        await saveData({"accessTokenData": this.accessTokenData});
    }

    getUserProfileData()
    {
        if(!this.isLinked())
            throw "User not linked";

        return this.userData;
    }

    setUserProfileData(newUserdata)
    {
        this.userData = newUserdata;
    }


    /*
        Fetch userdata from spotify api and saves it to chrome's local storage
    */
    async fetchUserProfileData()
    {   
        if(!this.isLinked())
            throw "User not linked";

        const payload = {
            headers: {
                "Authorization": "Bearer " + this.accessTokenData.access_token
            }
        };

        const response = await fetch(`https://api.spotify.com/v1/me`, payload);
        if(response.ok)
        {
            this.setUserProfileData(await response.json())
            await saveData({"userProfileData": this.userData});
            return;
        }

        const error = (await response.json()).error;
        console.log(`Playlist lookup failed. Received error code ${error.status} - ${error.message}`);
    }

    /*
        Checks whether a user has linked their spotify account.
    */
    isLinked()
    {
        return this.accessTokenData ? true : false;
    }

    /*
        Deletes token and profile data from chrome's local storage, effectively removing the linked user
    */
    async deleteCurrentUser()
    {
        if(!this.isLinked())
            throw "User not linked";

        if(this.accessTokenData)
        {
            await deleteData("accessTokenData")
            await deleteData("userProfileData");
            this.accessTokenData = undefined;
        }
    }


    /*
    Retrieves the current linked user's playlists
    @param accessToken: the current user's spotify access token
    @return an object containing data related to the user's playlists, including
    an array containing each playlist's data. Undefined on failure
    */
    async getCurrentUserPlaylists()
    {
        if(!this.isLinked())
            throw "User not linked";

        const payload = {
            headers: {
                "Authorization": "Bearer " + this.accessTokenData.access_token
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
    async getSavedTracks()
    {
        if(!this.isLinked())
            throw "User not linked";

        const payload = {
            headers: {
                "Authorization": "Bearer " + this.accessTokenData.access_token
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

    /*
    Add a specified track to a user's specified playlist
    @param playlistId the id of the playlist to add to
    @param trackUri a uri that specifies the type and id of a spotify track (https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids)
    @param accessToken: the user's access token
    @return a snapshot id; undefined on failure
    */
    async addTrackToPlaylist(playlistId, trackUri)
    {
        if(!this.isLinked())
            throw "User not linked";

        const payload = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.accessTokenData.access_token
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

    /*
        Checks if access token has expired
        @param: accessTokenData: the access token to check
        @return false if access token has expired; true if access token still valid
    */
    hasValidToken()
    {
        return !(this.accessTokenData && this.accessTokenData.expiration_timestamp < Date.now())
    }

    /*
        Refresh the access token
    */
    async refreshToken()
    {
        if(!this.isLinked())
            throw "User not linked";

        this.setAccessToken(await auth.refreshAccessToken(this.accessTokenData.refresh_token));
        await saveData({"accessTokenData" : this.accessTokenData});
    }
    
}