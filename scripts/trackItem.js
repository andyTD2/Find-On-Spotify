/*
    This class handles each individual track listing on the contextMenu
*/
export class trackItem {
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

    /*
        Create the html element from template, populate the appropriate fields
        with data, set the audio player, and set playlist menu listener
        @return htmlElement: the full html of the track item
    */
    init()
    {
        //Get template and clone
        let template = document.querySelector("#findOnSpotify-resultItemTemplate");
        let clone = template.content.cloneNode(true);

        clone.querySelector(".findOnSpotify-resultImage").src = this.trackImageUrl;
        clone.querySelector(".findOnSpotify-songTitleNested").innerText = this.trackName;
        clone.querySelector(".findOnSpotify-artistNested").innerText = this.trackArtists;

        //Set audio player if preview exists
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

        //Set open playlist listener
        this.setOpenPlaylistMenuListener(clone.querySelector(".findOnSpotify-playlists"));
        return clone.firstElementChild;
    }

    /*
        @return the html element of the track item
    */
    getHtmlElement()
    {
        return this.htmlElement;
    }

    /*
        Set volume of this track item's audio player
    */
    setTrackVolume(newVolume)
    {
        this.htmlElement.querySelector(".findOnSpotify-audio").volume = newVolume / 100;
    }

    /*
        On btn click, bind the playlistMenu's trackUri to this.trackUri,
        then open the playlistMenu
        @param btn: The btn element to click
    */
    setOpenPlaylistMenuListener(btn)
    {
        btn.addEventListener("click", (event) =>
        {
            this.playlistMenu.setCurrentTrackUri(this.trackUri);
            this.playlistMenu.openPlaylistMenu(event);
        })
    }

    /*
        Play audio and change the play btn to the pause btn.
        @param playBtn: the playBtn element to click in order to activate
        @param pauseBtn: the pauseBtn element to display after click
        @param audioPlayer: the audio element to play on click
    */
    setPlayBtnListener(playBtn, pauseBtn, audioPlayer)
    {
        playBtn.addEventListener("click", () => {
            audioPlayer.play();
            playBtn.style.display = "none";
            pauseBtn.style.display = "block";
        })
    }

    /*
        Pause audio and change the pause btn to the play btn.
        @param pauseBtn: the pauseBtn element to click in order to activate
        @param playBtn: the playBtn element to display after click
        @param audioPlayer: the audio element to play on click
    */
    setPauseBtnListener(pauseBtn, playBtn, audioPlayer)
    {
        pauseBtn.addEventListener("click", () => {
            audioPlayer.pause();
            pauseBtn.style.display = "none";
            playBtn.style.display = "block";
        })
    }

    /*
        Display the replay audio btn once audio has finished.
        @param pauseBtn: the pauseBtn element that will be replaced
        @param replayBtn: the new btn to display
        @param audioPlayer: the audio element
    */
    setAudioEndedListener(pauseBtn, replayBtn, audioPlayer)
    {
        audioPlayer.addEventListener("ended", () => {
            pauseBtn.style.display = "none";
            replayBtn.style.display = "block";
        })
    }

    /*
        Play audio and change the replay btn to the pause btn.
        @param replayBtn: the replayBtn element to click in order to activate
        @param pauseBtn: the pauseBtn element to display after click
        @param audioPlayer: the audio element to play on click
    */
    setReplayBtnListener(replayBtn, pauseBtn, audioPlayer)
    {
        replayBtn.addEventListener("click", () => {
            audioPlayer.play();
            replayBtn.style.display = "none";
            pauseBtn.style.display = "block";
        })
    }


}