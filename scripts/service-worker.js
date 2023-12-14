import * as auth from "/auth.js"

chrome.action.onClicked.addListener(
    async function() { 
        //chrome.action.setPopup({popup: "popup.html"}); 
        await auth.validateAuth();
        console.log("Clicked on popup");
    }
);