import * as auth from "/auth.js"

chrome.action.onClicked.addListener(
    async function() { 
        //chrome.action.setPopup({popup: "popup.html"});
        let accessToken = await auth.getAccessToken();
        console.log("Access token response:", accessToken);
        console.log("Clicked on popup");

        console.log("Retrieving Access Token Data From Storage:", await auth.loadAccessTokenData());
    }
);