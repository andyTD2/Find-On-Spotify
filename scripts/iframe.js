(async () => 
{
    attachMsgListener();
    const id = await getTabId();
    attachBtnListener();
})();


function attachVolumeControlListener(slider) {
    let curVolume = document.getElementById("findOnSpotify-currentVolume");
    slider.addEventListener("input", function()
    {
        curVolume.innerHTML = slider.value;
        const listOfAudioPlayers = document.getElementsByClassName("findOnSpotify-audio");
        for(let audioPlayer of listOfAudioPlayers)
        {
            audioPlayer.volume = slider.value / 100;
        }
    })
}



function attachAudioBtnListener(audioContainers)
{
    for (let audioContainer of audioContainers)
    {
        let player = audioContainer.getElementsByClassName("findOnSpotify-audio")[0];
        let playBtn = audioContainer.getElementsByClassName("findOnSpotify-playAudio")[0];
        let pauseBtn = audioContainer.getElementsByClassName("findOnSpotify-pauseAudio")[0];

        playBtn.addEventListener("click", function() {
            player.play();
            playBtn.style.display = "none";
            pauseBtn.style.display = "block";
        })

        pauseBtn.addEventListener("click", function() {
            player.pause();
            pauseBtn.style.display = "none";
            playBtn.style.display = "block";
        })
    }
}




function attachBtnListener()
{
    let btn = document.getElementById("findOnSpotify-button");
    let menu = document.getElementById("findOnSpotify-contextMenu");

    btn.addEventListener("click", async function(event) {
        btn.style.display = "none";
        menu.style.display = "block";
        const id = await getTabId();
        chrome.tabs.sendMessage(id, {request: "RESIZE_IFRAME", width: "400px", height: "400px"});
        console.log((await chrome.tabs.sendMessage(id, {request: "GET_SELECTION"})).selection);


        let selection = (await chrome.tabs.sendMessage(id, {request: "GET_SELECTION"})).text;
        if(selection.length > 1)
        {
            let trackData = await chrome.runtime.sendMessage({request: "SEARCH_QUERY", query: selection});
            if(trackData.success) trackData = trackData.data;
            console.log("trackdata:", trackData);

            let userData = await chrome.runtime.sendMessage({request: "GET_USER"});
            if(userData.success) userData = userData.data;
            console.log("userdata:", userData);

            let playlistData = await chrome.runtime.sendMessage({request: "GET_PLAYLISTS"});
            if(playlistData.success) playlistData = playlistData.data;
            console.log("playlistdata:", playlistData);

            let savedTrackData = await chrome.runtime.sendMessage({request: "GET_SAVED_TRACKS"});
            if(savedTrackData.success) savedTrackData = savedTrackData.data;
            console.log("saveddata:", savedTrackData);

            attachAudioBtnListener(document.getElementsByClassName("findOnSpotify-resultItem"));
            attachVolumeControlListener(document.getElementById("findOnSpotify-volumeSlider"));
        }
        event.stopPropagation
    })
}


function attachMsgListener()
{
    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            console.log("iframe script received message:", message);
        }
    );
}



async function getTabId()
{
    return (await chrome.runtime.sendMessage({request: "GET_TAB_ID"})).id;
}