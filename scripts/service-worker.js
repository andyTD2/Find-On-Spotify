import * as auth from "/scripts/auth.js";
import * as track from "/scripts/track.js";

/*
(async () => 
{
    console.log("Searching Track");
    console.log(await track.searchTrack("pour me a heavy dose of atmosphere"));
})();
*/

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        (async () => {
            let accessTokenData = await auth.loadAccessTokenData();

            if (accessTokenData && accessTokenData.expiration_timestamp < Date.now())
            {
                accessTokenData = await auth.refreshAccessToken(accessTokenData.refresh_token);
                await auth.saveAccessTokenData(accessTokenData);
                console.log("refreshing token");
            }

            if (message.request == "GET_LINK_STATUS")
            {
                sendResponse({linkStatus: accessTokenData ? true : false});
            }
            else if (message.request == "UNLINK_ACCOUNT")
            {
                if (accessTokenData) {await auth.deleteAccessTokenData()};
                sendResponse({success : true});
            }
            else if (message.request == "LINK_ACCOUNT")
            {
                let token = await auth.getAccessToken();
                await auth.saveAccessTokenData(token);
                sendResponse({success : true});
            }
            else if (message.request == "SEARCH_QUERY")
            {
                const result = await track.searchTrack(message.query);
                sendResponse({success: true, data: result});
            }
          })();
        return true;
    }
)