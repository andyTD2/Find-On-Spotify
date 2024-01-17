import * as track from "/scripts/track.js";
import {User} from "/scripts/user.js";
import {loadData, saveData, deleteData} from "/scripts/utils/storage.js";
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
                    await user.fetchAuthorization();
                    await user.fetchUserProfileData();
                    params.sendResponse({success : true});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'SEARCH_QUERY':
            async (params) => {
                try {
                    params.sendResponse({
                        success: true, 
                        data: await track.searchTrack(params.query, (await user.getAccessToken()).access_token)});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_PLAYLISTS': 
            async (params) => {
                try {
                    params.sendResponse({
                        success: true,
                        data: await user.getCurrentUserPlaylists()})
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_USER': 
            async (params) => {
                try {
                    params.sendResponse({
                        success: true,
                        data: await user.getUserProfileData()});
                }
                catch(error)
                {
                    params.sendResponse({success: false});
                }
            },

        'GET_SAVED_TRACKS':
            async (params) => {
                try {
                    params.sendResponse({
                        success: true,
                        data: await user.getSavedTracks()});
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
                    params.sendResponse({
                        success: true,
                        data: await user.addTrackToPlaylist(params.playlistId, params.trackUri)})
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

