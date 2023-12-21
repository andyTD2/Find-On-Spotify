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

function attachBtnListener(btn)
{
    btn.addEventListener("click", async function(event)
    {
        console.log("clicked");
        const menu = document.getElementById("findOnSpotify-contextMenu");
        makeVisible(menu);
        makeHidden(btn);

        const selection = window.getSelection().toString();
        if(selection.length > 0)
        {
            menu.innerHTML = selection;

            let response = await chrome.runtime.sendMessage({request: "SEARCH_QUERY", query: selection});
            console.log(response.data);
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

async function injectHtml(htmlFile)
{
    const response = await fetch(chrome.runtime.getURL(htmlFile));
    const html = await response.text();

    document.body.insertAdjacentHTML("beforeend", html);
    attachCloseOnClickListener(document.getElementById("findOnSpotify-button"));
    attachCloseOnClickListener(document.getElementById("findOnSpotify-contextMenu"));
    attachBtnListener(document.getElementById("findOnSpotify-button"));
}
