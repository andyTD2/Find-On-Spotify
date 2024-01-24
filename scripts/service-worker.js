import {User} from "/scripts/user.js";
import {loadData} from "/scripts/utils/storage.js";
import { messageHandler } from "/scripts/messageHandler.js";


/*
    Everytime a message is received, this function will call the corresponding message handler function.
    @param message: an object containing the contents of the message
    @param sender: an object containing information about the sender of the message
    @param sendResponse: chrome function to send a return response
    @param msgHandler: an object of the messageHandler class
*/
async function onMessageHandler(user, message, sender, sendResponse, msgHandler)
{
    console.log(message);

    if(!user.hasValidToken())
    {
        await user.refreshToken();
    }
    msgHandler.handleFunction({sender, sendResponse, ...message});
}


/*
    Service worker/background script entry point. Sets up the 
    messageHandler objects and starts the onMessage event listener
*/
async function main()
{
    let user = new User(await loadData("accessTokenData"));

    let msgHandler = new messageHandler(
    {
        'GET_LINK_STATUS': 
            (params) => {
                params.sendResponse({linkStatus: user.isLinked()});
            },

        'UNLINK_ACCOUNT': 
            async (params) => {
                try {
                    await user.deleteCurrentUser();
                    params.sendResponse({success : true});
                }
                catch(error)
                {
                    console.log(error);
                    params.sendResponse({success: false, error});
                }
            },

        'LINK_ACCOUNT':
            async (params) => {
                try {
                    if (await user.fetchAuthorization() && await user.fetchUserProfileData())
                        params.sendResponse({success : true});
                    else
                        params.sendResponse({success: false});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'SEARCH_QUERY':
            async (params) => {
                try {
                    let result = await user.searchTrack(params.query);
                    params.sendResponse({
                        success: result ? true : false, 
                        data: result});

                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_PLAYLISTS': 
            async (params) => {
                try {
                    let result = await user.getCurrentUserPlaylists();
                    params.sendResponse({
                        success: result ? true : false, 
                        data: result})
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_USER': 
            async (params) => {
                try {
                    let result = user.getUserProfileData();
                    params.sendResponse({
                        success: result ? true : false,
                        data: result});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_SAVED_TRACKS':
            async (params) => {
                try {
                    let result = await user.getSavedTracks();
                    params.sendResponse({
                        success: result ? true : false,
                        data: result});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'IFRAME_LOADED': 
            (params) => {
                chrome.tabs.sendMessage(params.sender.tab.id);
            },   

        'GET_TAB_ID':
            (params) => {
                params.sendResponse({id: params.sender.tab.id});
            },

        'ADD_TO_PLAYLIST':
            async (params) => {
                try {
                    let result = await user.addTrackToPlaylist(params.playlistId, params.trackUri);
                    params.sendResponse({
                        success: result ? true : false,
                        data: result});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },
    });

    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            onMessageHandler(user, message, sender, sendResponse, msgHandler);
            return true;
        }
    )
}

main();

