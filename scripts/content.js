loadContent();

function getClampedPosToBox(innerBoundingBox, outerBoundingBox)
{
    console.log("inner", innerBoundingBox);
    console.log("innerBoundingBox.right", innerBoundingBox.right, "outBoundingRight", outerBoundingBox.right);
    console.log("innerBoundingBox.bottom", innerBoundingBox.bottom, "outBoundingBottom", outerBoundingBox.bottom);
    return {
        left: (innerBoundingBox.right > outerBoundingBox.right) ? outerBoundingBox.right - (innerBoundingBox.right - innerBoundingBox.left) : innerBoundingBox.left,
        top: (innerBoundingBox.bottom > outerBoundingBox.bottom) ? outerBoundingBox.bottom - (innerBoundingBox.bottom - innerBoundingBox.top) : innerBoundingBox.top
    }
}
/*
    return {
        left: (innerBoundingBox.right > window.innerWidth) ? window.innerWidth - width : left,
        top: (bottom > window.innerHeight) ? window.innerHeight - height : bottom - height
    }
*/



/*
    Entry point. Set message handler and on select listener
*/
async function loadContent()
{
    await attachMsgListener();
    let debouncedOnSelect = debounce(onSelect);
    document.addEventListener("selectionchange", async function(event){
        await debouncedOnSelect();
    });
}

/*
    Resize the injected iframe
    @param iframe: the iframe element to adjust
    @param width: the resize width including size units
    @param height: the resize height including size units
*/
function setIframeSize(iframe, width, height)
{
    iframe.style.width = `${width}`;
    iframe.style.height = `${height}`;
}

/*
    Set the injected iframe's radius
    @param iframe: the iframe element to adjust
    @param radius: the new radius
*/
function setIframeRadius(iframe, radius)
{
    iframe.style.borderRadius = radius;
}

/*
    Create and insert iframe
    param pos: an object containing the following positional data
        right: the right side of the selected text
        bottom: the bottom of the selected text
*/
function insertIFrame(pos)
{
    const iframe = document.createElement("iframe");
    iframe.id = "findOnSpotify-iFrame";
    iframe.src = "chrome-extension://phbbhhccncpkopkloglnkamlafiepnge/views/contextMenuBtn.html";


    setIframeRadius(iframe, "50%");
    setIframeSize(iframe, "0px", "0px");
    iframe.style.borderWidth = "0px";
    iframe.style.position = "absolute";
    iframe.style.backgroundColor = "transparent";
    iframe.style.overflow = "scroll";
    iframe.style.zIndex = 10000;
    iframe.style.left = `${pos.right + window.scrollX}px`;
    iframe.style.top = `${pos.bottom + window.scrollY}px`;

    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);    
    attachCloseOnClickListener(iframe);
    return iframe;
}


/*
    Sets a listener that removes removes an element
    when the user clicks off the element.
    param element: the element to remove
*/
function attachCloseOnClickListener(element)
{
    document.addEventListener("mousedown", function removeMenuOnOutsideClick(event) {
        if(!element.contains(event.target))
        {
            element.remove();
            document.removeEventListener("mousedown", removeMenuOnOutsideClick);
        }
    })
}

/*
    Listens to and responds to messages received by the iframe or background scripts.
*/
async function attachMsgListener()
{
    //import the messageHandler class
    const messageHandler = (await import(chrome.runtime.getURL("scripts/messageHandler.js"))).messageHandler;

    let msgHandler = new messageHandler(
        {
            'SET_IFRAME_SIZE': 
                (params) => {
                    console.log("resize params:", params);
                    const iframeElement = document.getElementById("findOnSpotify-iFrame");
                    setIframeSize(iframeElement, params.width, params.height);

                    const bounds = iframeElement.getBoundingClientRect();
                    const clampedPos = getClampedPosToBox(
                        {
                            left: bounds.left + window.scrollX, 
                            top: bounds.top + window.scrollY,
                            right: bounds.left + window.scrollX + iframeElement.offsetWidth,
                            bottom: bounds.top + window.scrollY + iframeElement.offsetHeight
                        }, 
                        {
                            right: document.documentElement.clientWidth + window.scrollX,
                            bottom: document.documentElement.clientHeight + window.scrollY
                        });

                    iframeElement.style.top = `${clampedPos.top}px`;
                    iframeElement.style.left = `${clampedPos.left}px`;
                },
            
            'GET_SELECTION':
                (params) => {
                    params.sendResponse({text: window.getSelection().toString()});
                },

            'SET_IFRAME_RADIUS':
                (params) => {
                    setIframeRadius(document.getElementById("findOnSpotify-iFrame"), params.radius);
                },

            'FRAME_LOADED':
                (params) => {
                    
                    const iframeElement = document.getElementById("findOnSpotify-iFrame");
                    
                    setIframeSize(iframeElement, params.width, params.height);
                    
                    iframePos = iframeElement.getBoundingClientRect();
                    
                    const clampedPos = getClampedPosToBox(
                        {
                            left: iframePos.left + window.scrollX, 
                            top: iframePos.top + window.scrollY,
                            right: iframePos.left + window.scrollX + parseInt(params.width),
                            bottom: iframePos.top + window.scrollY + parseInt(params.height)
                        }, 
                        {
                            right: document.documentElement.clientWidth + window.scrollX,
                            bottom: document.documentElement.clientHeight + window.scrollY
                        });
    
                    iframeElement.style.left = `${clampedPos.left}px`;
                    iframeElement.style.top = `${clampedPos.top}px`;
                        
                    iframeElement.style.visibility = "visible";
                }
        }
    );


    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            msgHandler.handleFunction({sender, sendResponse, ...message});
    });
}

/*
    Get the bottom right position of the selected text,
    which is where the iframe will be inserted
    @param selection: the selected text
*/
function getBtnPosition(selection)
{
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(false);

    //we insert an empty span and get the bounding box of that span to determine
    //the position. This seems to be more robust than simply getting the bounding
    //box of the selection itself.
    const empty = document.createElement("span");
    range.insertNode(empty);
    const {right, bottom} = empty.getBoundingClientRect();
    empty.remove();
    return {right, bottom};
}

/*
    Removes any existing iframe and injects a new iframe into the page
    based off the selection. Should be called everytime the selection changes.
*/
async function onSelect(){
    if (!chrome.runtime?.id)
        return;

    let existingIFrame = document.getElementById("findOnSpotify-iFrame");
    if (existingIFrame)
    {
        console.log("removing existing iframe:", existingIFrame);
        existingIFrame.remove();
    }

    let response = await chrome.runtime.sendMessage({request : "GET_LINK_STATUS"});
    if(response.linkStatus)
    {
        let selection = window.getSelection();
        let selectionText = selection.toString();
        if(selectionText.length > 0)
        {
            insertIFrame(getBtnPosition(selection));
        }
    }
}
