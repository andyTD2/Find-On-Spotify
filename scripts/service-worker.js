import * as auth from "/scripts/auth.js";
import * as track from "/scripts/track.js";
import * as user from "/scripts/user.js";
import {loadData, saveData, deleteData} from "/scripts/utils/storage.js";


(async () => 
{
    const tok = await loadData("accessTokenData");
    if (!tok) return;

    console.log(await user.getCurrentUserPlaylists(tok.access_token));
})();


chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        (async () => {
            let accessTokenData = await loadData("accessTokenData");

            if (accessTokenData && accessTokenData.expiration_timestamp < Date.now())
            {
                accessTokenData = await auth.refreshAccessToken(accessTokenData.refresh_token);
                await saveData({"accessTokenData" : accessTokenData});
                console.log("refreshing token");
            }

            switch(message.request)
            {
                case "GET_LINK_STATUS":
                    sendResponse({linkStatus: accessTokenData ? true : false});
                    break;
                
                case "UNLINK_ACCOUNT":
                    if (accessTokenData) {
                        await deleteData("accessTokenData")
                        await deleteData("userProfileData");
                    };
                    sendResponse({success : true});
                    break;

                case "LINK_ACCOUNT":
                    accessTokenData = await auth.getAccessToken()
                    await saveData({"accessTokenData": accessTokenData});
                    await saveData({"userProfileData": await auth.getUserData(accessTokenData.access_token)});
    
                    sendResponse({success : true});
                    break;

                case "SEARCH_QUERY":
                    sendResponse({
                        success: true, 
                        data: await track.searchTrack(message.query, accessTokenData.access_token)
                    });
                    break;

                case "GET_PLAYLISTS":
                    sendResponse({
                        success: true,
                        data: await user.getCurrentUserPlaylists(accessTokenData.access_token)
                    })
                    break;

                case "GET_USER":
                    sendResponse({
                        success: true,
                        data: await loadData("userProfileData")
                    });
                    break;

                case "GET_SAVED_TRACKS":
                    sendResponse({
                        success: true,
                        data: await user.getCurrentUserSavedTracks(accessTokenData.access_token)
                    });
                    break;

                case "IFRAME_LOADED":
                    chrome.tabs.sendMessage(sender.tab.id, {test: true});
                    break;

                case "GET_TAB_ID":
                    sendResponse({id: sender.tab.id});
                    break;

                case "ADD_TO_PLAYLIST":
                    let result = await track.addTrackToPlaylist(message.playlistId, message.trackUri, accessTokenData.access_token);
                    console.log(result);
                    sendResponse({
                        success: true,
                        data: result
                    })
                    break;
            }

          })();
        return true;
    }
)
