class contextMenu {

    constructor(id, width, height)
    {
        this.id = id;
        this.width = width;
        this.height = height;
        this.currentTrackUri = null;

        this.setOpenContextMenuBtnListener();
    }


    setAutoScrollOnOverflow(element)
    {
        if (element.scrollWidth > element.clientWidth)
        {
            element.classList.add("findOnSpotify-autoScroll");
        }
    }

    setVolume(newVolume)
    {
        document.getElementById("findOnSpotify-currentVolume").innerText = newVolume;
        const listOfAudioPlayers = document.getElementsByClassName("findOnSpotify-audio");
        for(let audioPlayer of listOfAudioPlayers)
        {
            audioPlayer.volume = newVolume / 100;
        }
    }

    setVolumeControlListener(slider)
    {
        slider.addEventListener("input", () =>
        {
            this.setVolume(slider.value);
        })
    }

    setPlayBtnListener(playBtn, pauseBtn, audioPlayer)
    {
        playBtn.addEventListener("click", () => {
            audioPlayer.play();
            playBtn.style.display = "none";
            pauseBtn.style.display = "block";
        })
    }

    setPauseBtnListener(pauseBtn, playBtn, audioPlayer)
    {
        pauseBtn.addEventListener("click", () => {
            audioPlayer.pause();
            pauseBtn.style.display = "none";
            playBtn.style.display = "block";
        })
    }

    setAudioEndedListener(pauseBtn, replayBtn, audioPlayer)
    {
        audioPlayer.addEventListener("ended", () => {
            pauseBtn.style.display = "none";
            replayBtn.style.display = "block";
        })
    }

    setReplayBtnListener(replayBtn, pauseBtn, audioPlayer)
    {
        replayBtn.addEventListener("click", () => {
            audioPlayer.play();
            replayBtn.style.display = "none";
            pauseBtn.style.display = "block";
        })
    }


    setOpenSaveTrackMenuListener(btn, trackUri)
    {
        btn.addEventListener("click", (event) =>
        {
            this.currentTrackUri = trackUri;
            let container = document.getElementById("findOnSpotify-contextMenu").getBoundingClientRect();
            let menu = document.getElementById("findOnSpotify-saveTrackMenu");
            let menuWidth = menu.offsetWidth;
            let menuHeight = menu.offsetHeight;
    
            menu.style.left = (menuWidth + event.clientX > container.right) ? event.clientX - menuWidth : event.clientX;
            menu.style.top = (menuHeight + event.clientY > container.bottom) ? event.clientY - menuHeight : event.clientY;
    
            menu.style.display = "block";
        })
    }

    populateTrackList(trackList)
    {
        let trackListContainer = document.getElementById("findOnSpotify-searchResults");
        let template = document.querySelector("#findOnSpotify-resultItemTemplate");

        for (let i = 0; i < trackList.length; ++i)
        {
            let clone = template.content.cloneNode(true);

            clone.querySelector(".findOnSpotify-resultImage").src = 
                (trackList[i].album.images.length > 0) ? trackList[i].album.images[0].url : "/views/images/placeholder.png";
            clone.querySelector(".findOnSpotify-songTitleNested").innerText = trackList[i].name;
            
            let artists = trackList[i].artists[0].name;
            for (let j = 1; j < trackList[i].artists.length; ++j)
            {
                artists += ", " + trackList[i].artists[j].name
            }
            clone.querySelector(".findOnSpotify-artistNested").innerText = artists;
            
            if(trackList[i].preview_url)
            {
                const audioPlayer = clone.querySelector(".findOnSpotify-audio");
                const playBtn = clone.querySelector(".findOnSpotify-playAudio");
                const pauseBtn = clone.querySelector(".findOnSpotify-pauseAudio");
                const replayBtn = clone.querySelector(".findOnSpotify-replayAudio");

                audioPlayer.src = trackList[i].preview_url;
                this.setPlayBtnListener(playBtn, pauseBtn, audioPlayer);
                this.setPauseBtnListener(pauseBtn, playBtn, audioPlayer);
                this.setAudioEndedListener(pauseBtn, replayBtn, audioPlayer);
                this.setReplayBtnListener(replayBtn, pauseBtn, audioPlayer);
            }
            else
            {
                clone.querySelector(".findOnSpotify-playAudio").style.display = "none";
                clone.querySelector(".findOnSpotify-playAudioNull").style.display = "block";
            }

            this.setOpenSaveTrackMenuListener(clone.querySelector(".findOnSpotify-playlists"), trackList[i].uri);
            let songTitle = clone.querySelector(".findOnSpotify-songTitleNested");
            let songArtist = clone.querySelector(".findOnSpotify-artistNested");


            trackListContainer.appendChild(clone);
            this.setAutoScrollOnOverflow(songTitle);
            this.setAutoScrollOnOverflow(songArtist);
        }
    }

    setSaveToPlaylistListener(playlistElement, playlistId)
    {
        playlistElement.addEventListener("click", async () => {
            console.log(playlistElement, playlistId, this.currentTrackUri);
            console.log("added playlist response:", (await chrome.runtime.sendMessage({request: "ADD_TO_PLAYLIST", playlistId: playlistId, trackUri: this.currentTrackUri})) )
        })
    }


    populatePlaylists(playlistList)
    {
        let playlistContainer = document.querySelector("#findOnSpotify-saveTrackMenuPlaylists");
        let template = document.querySelector("#findOnSpotify-saveTrackMenuTemplate");

        console.log(playlistList);
        for(let playlist of playlistList)
        {
            const clone = template.content.cloneNode(true);
            const playlistItem = clone.querySelector(".findOnSpotify-saveTrackMenuPlaylistItem");
            playlistItem.innerText = playlist.name;
            
            //playlistItem.addEventListener("click", () => {
            //    console.log("Add to playlist:", playlist.name, this.currentTrack);
            //});

            playlistContainer.appendChild(clone);
            this.setSaveToPlaylistListener(playlistItem, playlist.id);
        }
    }

    async setIFrameSize(id, width, height)
    {
        await chrome.tabs.sendMessage(id, {request: "RESIZE_IFRAME", width: width, height: height});
    }
    
    async getSelection(id)
    {
        return (await chrome.tabs.sendMessage(id, {request: "GET_SELECTION"})).text;
    }

    async query(query)
    {
        let response = await chrome.runtime.sendMessage({request: "SEARCH_QUERY", query: query});
        if(response.success) return response.data.tracks.items;
    }

    async getCurrentUser()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_USER"});
        if(response.success) return response.data;
    }

    async getPlaylists()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_PLAYLISTS"});
        if(response.success) return response.data.items;
    }

    async getSavedTracks()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_SAVED_TRACKS"});
        if(response.success) return response.data;
    }

    async openContextMenu(event)
    {
        let btn = document.getElementById("findOnSpotify-button");
        let menu = document.getElementById("findOnSpotify-contextMenu");

        btn.style.display = "none";
        menu.style.display = "block";
        this.setIFrameSize(this.id, this.width, this.height);

        const selection = await this.getSelection(this.id);
        event.stopPropagation();
        if(selection.length < 1) return;

        const trackData = await this.query(selection);
        if(trackData) 
        {this.populateTrackList(trackData); console.log(trackData)}

        let playlistData = await this.getPlaylists();
        if(playlistData) this.populatePlaylists(playlistData);

        this.setVolumeControlListener(document.getElementById("findOnSpotify-volumeSlider"));
    }

    setOpenContextMenuBtnListener()
    {
        document.getElementById("findOnSpotify-button").addEventListener("click", async (event) => {
            this.openContextMenu(event);
        }, {once: true});
    }

}












async function getTabId()
{
    return (await chrome.runtime.sendMessage({request: "GET_TAB_ID"})).id;
}

async function start()
{
    const x = new contextMenu(await getTabId(), "400px", "400px");
}
start();