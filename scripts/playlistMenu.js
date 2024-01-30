
/*
    Handles the playlistMenu element within the context menu
*/
export class playlistMenu {
    constructor(playlistList)
    {
        this.currentTrackUri = undefined;
        this.playlistHtmlElements = [];
        this.init(playlistList);
    }

    /*
        Set currentTrackUri; useful for binding the playlistMenu to a certain track
    */
    setCurrentTrackUri(trackUri)
    {
        this.currentTrackUri = trackUri;
    }

    /*
        Clamp the menu to within the contextMenu's borders, then display it.
        @param event: The click event that triggers this function.
    */
    openPlaylistMenu(event) 
    {
        let container = document.getElementById("findOnSpotify-contextMenu").getBoundingClientRect();
        let menu = document.getElementById("findOnSpotify-saveTrackMenu");
        menu.style.display = "block";
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;

        console.log(menuWidth);
        menu.style.left = (menuWidth + event.clientX > container.right) ? event.clientX - menuWidth : event.clientX;
        menu.style.top = (menuHeight + event.clientY > container.bottom) ? event.clientY - menuHeight : event.clientY;

        this.attachCloseOnClickListener(document.querySelector("#findOnSpotify-saveTrackMenu"));
    }

    /*
        Create the playlist menu from a template, populate the data fields,
        and set the on click playlist listener
        @param playlistList: List of playlist objects
    */
    init(playlistList)
    {
        let playlistContainer = document.querySelector("#findOnSpotify-saveTrackMenuPlaylists");
        let template = document.querySelector("#findOnSpotify-saveTrackMenuTemplate");

        for(let playlist of playlistList)
        {
            const clone = template.content.cloneNode(true);
            const playlistItem = clone.querySelector(".findOnSpotify-saveTrackMenuPlaylistItem");
            playlistItem.innerText = playlist.name;
            
            this.playlistHtmlElements.push(clone.firstElementChild);
            playlistContainer.appendChild(clone);
            this.setSaveToPlaylistListener(playlistItem, playlist.id);
        }

    }

    /*
        Closes element when user clicks outside the element.
        @param element: html element to close on outside click
    */
    attachCloseOnClickListener(element)
    {
        document.addEventListener("mousedown", function hideMenuOnOutsideClick(event) {
            if(!element.contains(event.target))
            {
                element.style.display = "none";
                document.removeEventListener("mousedown", hideMenuOnOutsideClick);
                console.log("closed");
            }
        })
    }

    /*
        On click, send add to playlist request to background script with the
        currently binded trackUri and current playlistId
        @param playlistElement: the playlist html element to add the listener to
        @param playlistId: the spotify id of the playlist
    */
    setSaveToPlaylistListener(playlistElement, playlistId)
    {
        playlistElement.addEventListener("click", async () => {
            await chrome.runtime.sendMessage({request: "ADD_TO_PLAYLIST", playlistId: playlistId, trackUri: this.currentTrackUri})
        })
    }

    getPlaylistElements()
    {
        return this.playlistHtmlElements;
    }
}
