(async () => 
{
    attachMsgListener();
    const id = await getTabId();
    attachBtnListener();

    for (let item of document.getElementsByClassName("findOnSpotify-playlists"))
    {
        attachOpenSaveTrackMenuListener(item);
    }
})();


function populateTrackList(trackList)
{
    console.log("populating track list", trackList);
    let trackListContainer = document.getElementById("findOnSpotify-searchResults");
    for (let i = 0; i < trackList.length; i++)
    {
        trackListContainer.insertAdjacentHTML("beforeend", 
        `<div class="findOnSpotify-resultItem">
            <img src="${trackList[i].album.images[0].url}" class="findOnSpotify-resultImage">
            <div class="findOnSpotify-songInfo">
                <div class="findOnSpotify-songTitle">${trackList[i].name}</div>
                <div class="findOnSpotify-songArtist">${trackList[i].artists[0].name}</div>
            </div>
            <div class="findOnSpotify-audioPlayer">
                <audio class="findOnSpotify-audio" src="${trackList[i].preview_url}"></audio>
                <button class="findOnSpotify-playAudio findOnSpotify-button"><img src="chrome-extension://phbbhhccncpkopkloglnkamlafiepnge/views/images/playIcon.png"></button>
                <button class="findOnSpotify-pauseAudio findOnSpotify-button"><img src="chrome-extension://phbbhhccncpkopkloglnkamlafiepnge/views/images/pauseIcon.png"></button>
                <button class="findOnSpotify-playlists findOnSpotify-button"><img src="chrome-extension://phbbhhccncpkopkloglnkamlafiepnge/views/images/plusIcon.png"></button>
            </div>
        </div>`);
        console.log("added one");
    }
}


function attachOpenSaveTrackMenuListener(btn)
{
    btn.addEventListener("click", function(event)
    {
        let container = document.getElementById("findOnSpotify-contextMenu").getBoundingClientRect();
        let menu = document.getElementById("findOnSpotify-saveTrackMenu");
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;

        menu.style.left = (menuWidth + event.clientX > container.right) ? event.clientX - menuWidth : event.clientX;
        menu.style.top = (menuHeight + event.clientY > container.bottom) ? event.clientY - menuHeight : event.clientY;

        menu.style.display = "block";
        console.log("clicked playlistsBtn");
    })
}


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


        let selection = (await chrome.tabs.sendMessage(id, {request: "GET_SELECTION"})).text;
        console.log("selection", selection);
        if(selection.length > 1)
        {
            let trackData = await chrome.runtime.sendMessage({request: "SEARCH_QUERY", query: selection});
            if(trackData.success) 
            {
                trackData = trackData.data.tracks.items;
                populateTrackList(trackData);
            }

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