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
            console.log("accessTokenData", accessTokenData);

            if (accessTokenData && accessTokenData.expiration_timestamp < Date.now())
            {
                accessTokenData = await auth.refreshAccessToken(accessTokenData.access_token);
                await saveData({"accessTokenData" : accessTokenData});
                console.log("refreshing token");
            }

            if (message.request == "GET_LINK_STATUS")
            {
                sendResponse({linkStatus: accessTokenData ? true : false});
            }
            else if (message.request == "UNLINK_ACCOUNT")
            {
                if (accessTokenData) {
                    await deleteData("accessTokenData")
                    await deleteData("userProfileData");
                };
                sendResponse({success : true});
            }
            else if (message.request == "LINK_ACCOUNT")
            {
                accessTokenData = await auth.getAccessToken()
                await saveData({"accessTokenData": accessTokenData});
                await saveData({"userProfileData": await auth.getUserData(accessTokenData.access_token)});

                sendResponse({success : true});
            }
            else if (message.request == "SEARCH_QUERY")
            {
                sendResponse({
                    success: true, 
                    data: await track.searchTrack(message.query, accessTokenData.access_token)
                });
            }
            else if (message.request == "GET_PLAYLISTS")
            {
                sendResponse({
                    success: true,
                    data: await user.getCurrentUserPlaylists(accessTokenData.access_token)
                })
            }
            else if (message.request == "GET_USER")
            {
                sendResponse({
                    success: true,
                    data: await loadData("userProfileData")
                });
            }
            else if (message.request == "GET_SAVED_TRACKS")
            {
                sendResponse({
                    success: true,
                    data: await user.getCurrentUserSavedTracks(accessTokenData.access_token)
                });
            }
          })();
        return true;
    }
)

