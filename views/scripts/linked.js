let button = document.getElementById("unlink-account");
button.addEventListener("click", async function()
{
    let response = await chrome.runtime.sendMessage({request : "UNLINK_ACCOUNT"});
    if (response.success)
    {
        window.location.href = "/views/unlinked.html";
    }
});