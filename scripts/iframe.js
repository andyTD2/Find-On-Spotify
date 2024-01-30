async function openMenuOnBtnClick()
{
    const contextMenu = (await import(chrome.runtime.getURL("scripts/contextMenu.js"))).contextMenu;
    const tabId = (await chrome.runtime.sendMessage({request: "GET_TAB_ID"})).id;
    const menu = new contextMenu(tabId, "25rem", "25rem", "15px");

    document.getElementById("findOnSpotify-openMenuButton").addEventListener("click", async (event) => {
        menu.init(event);
    }, {once: true});
}

openMenuOnBtnClick();