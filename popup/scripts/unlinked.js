let button = document.getElementById("link-account");
button.addEventListener("click", async function()
{
    let response = await chrome.runtime.sendMessage({request : "LINK_ACCOUNT"});
    if(response.success)
    {
        window.location.href = "/popup/views/linked.html";
    }
});