function setAutoScrollOnOverflow(element)
{
    if (element.scrollWidth > element.clientWidth)
    {
        element.classList.add("findOnSpotify-autoScroll");
    }
}

class playlistMenu {
    constructor(playlistList)
    {
        this.currentTrackUri = undefined;
        this.init(playlistList);
    }

    setCurrentTrackUri(trackUri)
    {
        this.currentTrackUri = trackUri;
    }

    openPlaylistMenu(event) 
    {
        let container = document.getElementById("findOnSpotify-contextMenu").getBoundingClientRect();
        let menu = document.getElementById("findOnSpotify-saveTrackMenu");
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;

        menu.style.left = (menuWidth + event.clientX > container.right) ? event.clientX - menuWidth : event.clientX;
        menu.style.top = (menuHeight + event.clientY > container.bottom) ? event.clientY - menuHeight : event.clientY;

        menu.style.display = "block";
    }


    init(playlistList)
    {
        let playlistContainer = document.querySelector("#findOnSpotify-saveTrackMenuPlaylists");
        let template = document.querySelector("#findOnSpotify-saveTrackMenuTemplate");

        for(let playlist of playlistList)
        {
            const clone = template.content.cloneNode(true);
            const playlistItem = clone.querySelector(".findOnSpotify-saveTrackMenuPlaylistItem");
            playlistItem.innerText = playlist.name;
            
            playlistContainer.appendChild(clone);
            this.setSaveToPlaylistListener(playlistItem, playlist.id);
        }
    }

    setSaveToPlaylistListener(playlistElement, playlistId)
    {
        playlistElement.addEventListener("click", async () => {
            await chrome.runtime.sendMessage({request: "ADD_TO_PLAYLIST", playlistId: playlistId, trackUri: this.currentTrackUri})
        })
    }
}

class songItem {
    constructor(trackImageUrl, previewUrl, trackName, trackArtists, trackUri, playlistMenu)
    {
        this.trackImageUrl = trackImageUrl;
        this.previewUrl = previewUrl;
        this.trackName = trackName;
        this.trackArtists = trackArtists;
        this.trackUri = trackUri;
        this.playlistMenu = playlistMenu;
        this.htmlElement = this.init();
    }

    init()
    {
        let template = document.querySelector("#findOnSpotify-resultItemTemplate");
        let clone = template.content.cloneNode(true);

        clone.querySelector(".findOnSpotify-resultImage").src = this.trackImageUrl;
        clone.querySelector(".findOnSpotify-songTitleNested").innerText = this.trackName;
        clone.querySelector(".findOnSpotify-artistNested").innerText = this.trackArtists;

        if(this.previewUrl)
        {
            const audioPlayer = clone.querySelector(".findOnSpotify-audio");
            const playBtn = clone.querySelector(".findOnSpotify-playAudio");
            const pauseBtn = clone.querySelector(".findOnSpotify-pauseAudio");
            const replayBtn = clone.querySelector(".findOnSpotify-replayAudio");

            audioPlayer.src = this.previewUrl;
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


        this.setOpenSaveTrackMenuListener(clone.querySelector(".findOnSpotify-playlists"), this.trackUri);
        return clone.firstElementChild;
    }

    getHtmlElement()
    {
        return this.htmlElement;
    }

    setTrackVolume(newVolume)
    {
        this.htmlElement.querySelector(".findOnSpotify-audio").volume = newVolume / 100;
    }

    setOpenSaveTrackMenuListener(btn, trackUri)
    {
        btn.addEventListener("click", (event) =>
        {
            this.playlistMenu.setCurrentTrackUri(trackUri);
            this.playlistMenu.openPlaylistMenu(event);
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


}

class contextMenu {

    constructor(id, width, height, borderRadius)
    {
        this.id = id;
        this.width = width;
        this.height = height;
        this.borderRadius = borderRadius;
        this.tracks = [];

        this.setOpenContextMenuBtnListener();
    }

    setVolume(newVolume)
    {
        document.getElementById("findOnSpotify-currentVolume").innerText = newVolume;
        for (let track of this.tracks)
        {
            track.setTrackVolume(newVolume);
        }
    }

    setVolumeControlListener(slider)
    {
        slider.addEventListener("input", () =>
        {
            this.setVolume(slider.value);
        })
    }

    setIFrameSize(width, height)
    {
        this.width = width;
        this.height = height;
    }

    async requestIFrameResize()
    {
        await chrome.tabs.sendMessage(this.id, {request: "SET_IFRAME_SIZE", width: this.width, height: this.height});
    }

    setIFrameRadius(radius)
    {
        this.borderRadius = radius;
    }

    async requestIFrameRadiusResize()
    {
        await chrome.tabs.sendMessage(this.id, {request: "SET_IFRAME_RADIUS", radius: this.borderRadius});
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

    async displayMenu()
    {
        document.getElementById("findOnSpotify-button").style.display = "none";
        document.getElementById("findOnSpotify-contextMenu").style.display = "block";
        await this.requestIFrameRadiusResize();
        await this.requestIFrameResize();
    }

    populateTrackList(trackList, sharedPlaylist)
    {
        let trackListContainer = document.getElementById("findOnSpotify-searchResults");
        for (let i = 0; i < trackList.length; ++i)
        {
            let artists = trackList[i].artists[0].name;
            for (let j = 1; j < trackList[i].artists.length; ++j)
            {
                artists += ", " + trackList[i].artists[j].name
            }
            
            
            let track = new songItem(
                (trackList[i].album.images.length > 0) ? trackList[i].album.images[0].url : "/views/images/placeholder.png",
                trackList[i].preview_url,
                trackList[i].name,
                artists,
                trackList[i].uri,
                sharedPlaylist);

            let trackHtmlElement = track.getHtmlElement();
            trackListContainer.appendChild(trackHtmlElement);
            setAutoScrollOnOverflow(trackHtmlElement.querySelector(".findOnSpotify-songTitleNested"));
            setAutoScrollOnOverflow(trackHtmlElement.querySelector(".findOnSpotify-artistNested"));
            this.tracks.push(track);

        }
    }

    async openContextMenu(event)
    {
        await this.displayMenu();
        const selection = await this.getSelection(this.id);
        event.stopPropagation();
        if(selection.length < 1) return;

        const trackData = await this.query(selection);
        const sharedPlaylist = new playlistMenu(await this.getPlaylists());
        if(trackData) 
        {
            this.populateTrackList(trackData, sharedPlaylist);
        }

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
    const x = new contextMenu(await getTabId(), "400px", "400px", "15px");
}
start();