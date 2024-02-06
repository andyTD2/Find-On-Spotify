async function getLinkedStatus()
{
    let response = await chrome.runtime.sendMessage({request : "GET_LINK_STATUS"});
    window.location.href = response.linkStatus ? "/popup/views/linked.html" : "/popup/views/unlinked.html";
    return;
}

getLinkedStatus();

