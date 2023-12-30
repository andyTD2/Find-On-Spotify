(async () => 
{
    attachMsgListener();
    const id = await getTabId();

    let debouncedOnSelect = debounce(onSelect);
    document.addEventListener("selectionchange", async function(event){
        await debouncedOnSelect();
    });
})();


function resizeIFrame(iframe, width, height)
{
    iframe.style.width = width;
    iframe.style.height = height;
}


function insertIFrame(pos)
{
    const iframe = document.createElement("iframe");
    iframe.style.all = "unset";
    iframe.id = "findOnSpotify-iFrame";
    iframe.src = "chrome-extension://phbbhhccncpkopkloglnkamlafiepnge/views/contextMenuBtn.html";
    iframe.style.position = "absolute";
    iframe.style.left = `${pos.right + window.scrollX}px`;
    iframe.style.top = `${pos.bottom + window.scrollY}px`;
    iframe.style.backgroundColor = "aqua";
    resizeIFrame(iframe, "25px", "25px");
    document.body.appendChild(iframe);
    attachCloseOnClickListener(iframe);
    return iframe;
}


/*
function attachIFrameOnLoadListener(iframe)
{
    iframe.addEventListener("load", function() {
        chrome.runtime.sendMessage({request: "IFRAME_LOADED"});
    });
}
*/

function attachCloseOnClickListener(element)
{
    document.addEventListener("mousedown", function(event) {
        if(!element.contains(event.target))
        {
            console.log("clickedoutside");
            element.remove();
        }
    })
}




function attachMsgListener()
{
    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            console.log("received from content.js:", message);

            if(message.request == "RESIZE_IFRAME")
            {
                console.log("resizing iframe");
                resizeIFrame(document.getElementById("findOnSpotify-iFrame"), message.width, message.height);
            }
            else if (message.request == "GET_SELECTION")
            {
                sendResponse({text: window.getSelection().toString()});
            }
    });
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
            insertIFrame(getBtnPosition(selection))
        }
    }
}






function display(element)
{
    element.style.display = "block";
}

function hide(element)
{
    element.style.display = "none";
}

async function getTabId()
{
    return (await chrome.runtime.sendMessage({request: "GET_TAB_ID"})).id;
}