/*
    This class handles the contextMenu element
*/
export class contextMenu {

    constructor(id, width, height, borderRadius)
    {
        this.id = id;
        this.width = width;
        this.height = height;
        this.borderRadius = borderRadius;
        this.tracks = [];
    }

    /*
        Sets the volume display and iterates through the contextMenu's list of tracks,
        changing the volume of each track to the new volume.
        @param newVolume: the new value for volume.
    */
    setVolume(newVolume)
    {
        document.getElementById("findOnSpotify-currentVolume").innerText = newVolume;
        for (let track of this.tracks)
        {
            track.setTrackVolume(newVolume);
        }
    }

    /*
        Adjust the context menu's volume each time the slider changes.
        @param slider: the slider element that controls volume input
    */
    setVolumeControlListener(slider)
    {
        slider.addEventListener("input", () =>
        {
            this.setVolume(slider.value);
        })
    }

    /*
        Set the size of the context menu
    */
    setIFrameSize(width, height)
    {
        this.width = width;
        this.height = height;
    }

    /*
        Enable automatic scrolling for elements that overflow their container's
        dimensions.
        @param element: the element to enable auto scroll
    */
    setAutoScrollOnOverflow(element)
    {
        if (element.scrollWidth > element.clientWidth)
        {
            element.classList.add("findOnSpotify-autoScroll");
        }
    }

    /*
        Send a message to the content script to resize the iframe to the context menu's dimensions.
        This should be used in conjunction with changing the size of the context menu
    */
    async requestIFrameResize(optionalDimensions)
    {
        if(!optionalDimensions)
        {
            await chrome.tabs.sendMessage(this.id, {request: "SET_IFRAME_SIZE", width: this.width, height: this.height});
            return;
        }

        await chrome.tabs.sendMessage(this.id, {request: "SET_IFRAME_SIZE", width: optionalDimensions.width, height: optionalDimensions.height});
    }

    /*
        Set the context menu's border radius
    */
    setIFrameRadius(radius)
    {
        this.borderRadius = radius;
    }

    /*
        Send a message to the content script to change the border radius of the iframe
        to match the context menu.
    */
    async requestIFrameRadiusResize()
    {
        await chrome.tabs.sendMessage(this.id, {request: "SET_IFRAME_RADIUS", radius: this.borderRadius});
    }
    
    /*
        Request the user's text selection from the content script
        @param id: the tab id of the content script
        @return the text of the user's selection
    */
    async getSelection(id)
    {
        return (await chrome.tabs.sendMessage(id, {request: "GET_SELECTION"})).text;
    }

    /*
        Submit a query request to the background script to search for tracks.
        @param query: the search terms
        @return an object containing a list of tracks found in spotify's api
    */
    async query(query)
    {
        let response = await chrome.runtime.sendMessage({request: "SEARCH_QUERY", query: query});
        if(response.success) return response.data.tracks.items;
    }


    /*
        Submit a request to get information about the current user's spotify account
        @return an object containing various data about current user's spotify account
    */
    async getCurrentUser()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_USER"});
        if(response.success) return response.data;
    }

    /*
        Submit a request to get the current user's playlists
        @return an object containing a list of the current user's playlists
    */
    async getPlaylists()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_PLAYLISTS"});
        if(response.success) return response.data.items;
    }

    /*
        Submit a request to get the current user's saved tracks
        @return an object containing a list of the current user's saved tracks
    */
    async getSavedTracks()
    {
        const response = await chrome.runtime.sendMessage({request: "GET_SAVED_TRACKS"});
        if(response.success) return response.data;
    }

    /*
        Hide the open menu button, display the menu, and request the content script
        match the context menu's border radius and size
    */
    async displayMenu()
    {
        document.getElementById("findOnSpotify-openMenuButton").style.display = "none";

        const menu = document.getElementById("findOnSpotify-contextMenu");

        menu.style.display = "block";

        await this.requestIFrameRadiusResize();
        await this.requestIFrameResize({width: `${menu.offsetWidth}px`, height: `${menu.offsetHeight}px`});
    }

    /*
        Given a list of tracks, create a list of trackItems for each track. Each track item uses
        a shared playlist. Append the track items to the context menu's html element.
        @param trackList: list of track objects
        @param sharedPlaylist: a playlistMenu that will be shared between each track item
    */
    async populateTrackList(trackList, sharedPlaylist)
    {
        //IMPORT trackItem CLASS
        const trackItem = (await import(chrome.runtime.getURL("/content/iFrame/scripts/trackItem.js"))).trackItem;

        let trackListContainer = document.getElementById("findOnSpotify-searchResults");
        for (let i = 0; i < trackList.length; ++i)
        {
            let artists = trackList[i].artists[0].name;
            for (let j = 1; j < trackList[i].artists.length; ++j)
            {
                artists += ", " + trackList[i].artists[j].name
            }
            
            
            let track = new trackItem(
                (trackList[i].album.images.length > 0) ? trackList[i].album.images[0].url : "/content/iFrame/views/images/placeholder.png",
                trackList[i].preview_url,
                trackList[i].name,
                artists,
                trackList[i].uri,
                sharedPlaylist);

            let trackHtmlElement = track.getHtmlElement();
            trackListContainer.appendChild(trackHtmlElement);
            this.setAutoScrollOnOverflow(trackHtmlElement.querySelector(".findOnSpotify-songTitleNested"));
            this.setAutoScrollOnOverflow(trackHtmlElement.querySelector(".findOnSpotify-artistNested"));
            this.tracks.push(track);

        }
    }

    /*
        Opens and initializes the context menu
        @param event the event that caused the menu to open
    */
    async init(event)
    {

        //IMPORT playlistMenu CLASS
        const playlistMenu = (await import(chrome.runtime.getURL("/content/iFrame/scripts/playlistMenu.js"))).playlistMenu;


        await this.displayMenu();
        const selection = await this.getSelection(this.id);
        event.stopPropagation();
        if(selection.length < 1) return;

        const trackData = await this.query(selection);
        const sharedPlaylist = new playlistMenu(await this.getPlaylists());
        for(let playlistElement of sharedPlaylist.getPlaylistElements())
        {
            this.setAutoScrollOnOverflow(playlistElement.querySelector(".findOnSpotify-saveTrackMenuPlaylistItem"));
        }

        if(trackData) 
        {
            await this.populateTrackList(trackData, sharedPlaylist);
        }

        this.setVolumeControlListener(document.getElementById("findOnSpotify-volumeSlider"));
    }
}