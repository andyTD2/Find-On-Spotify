async function getLinkedStatus()
{
    let response = await chrome.runtime.sendMessage({request : "GET_LINK_STATUS"});
    window.location.href = response.linkStatus ? "/views/linked.html" : "/views/unlinked.html";
    return;
}

getLinkedStatus();

