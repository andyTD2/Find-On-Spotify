let debouncedOnSelect = debounce(onSelect);
injectHtml("/views/contextMenuBtn.html");

document.addEventListener("selectionchange", async function(event){
    await debouncedOnSelect();
});













function makeVisible(element)
{
    element.classList.remove("findOnSpotify-closed");
    element.classList.add("findOnSpotify-opened");
}

function makeHidden(element)
{
    element.classList.remove("findOnSpotify-opened");
    element.classList.add("findOnSpotify-closed");
}

function getBtnPosition(selection)
{
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(false);
    const empty = document.createElement("span");
    range.insertNode(empty);
    const {right, bottom} = empty.getBoundingClientRect();
    empty.remove();
    return {right, bottom};
}

async function moveBtnMenu(pos)
{
    const inserted = document.getElementById("findOnSpotify");
    inserted.setAttribute("style", `position: absolute; left: ${pos.right + window.scrollX}px; top: ${pos.bottom + window.scrollY}px`);

    let btn = document.getElementById("findOnSpotify-button");
    makeVisible(btn);
}

function attachAudioBtnListener()
{
    let audioContainers = document.getElementsByClassName("findOnSpotify-resultItem");
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

function attachBtnListener(btn)
{
    btn.addEventListener("click", async function(event)
    {
        console.log("clicked");
        const menu = document.getElementById("findOnSpotify-contextMenu");
        makeVisible(menu);
        makeHidden(btn);

        const selection = window.getSelection().toString();
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

            attachAudioBtnListener();
        }
        event.stopPropagation();
    })
}


async function onSelect(){
    if (!chrome.runtime?.id)
        return;

    let response = await chrome.runtime.sendMessage({request : "GET_LINK_STATUS"});
    if(response.linkStatus)
    {
        let selection = window.getSelection();
        let selectionText = selection.toString();
        if(selectionText.length > 0)
        {
            await moveBtnMenu(getBtnPosition(selection));
        }
    }
}


function attachCloseOnClickListener(element)
{
    document.addEventListener("mousedown", function(event) {
        if(!element.contains(event.target))
        {
            console.log("clickedoutside");
            makeHidden(element);
        }
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



async function injectHtml(htmlFile)
{
    const response = await fetch(chrome.runtime.getURL(htmlFile));
    const html = await response.text();

    document.body.insertAdjacentHTML("beforeend", html);
    attachCloseOnClickListener(document.getElementById("findOnSpotify-button"));
    attachCloseOnClickListener(document.getElementById("findOnSpotify-contextMenu"));
    attachVolumeControlListener(document.getElementById("findOnSpotify-volumeSlider"));
    attachBtnListener(document.getElementById("findOnSpotify-button"));
}
