/*
    Saves information to chrome's local storage
    @param objectToSave: an object to save in the form {key : data}
    return: none
*/
export async function saveData(objectToSave)
{
    if(!objectToSave)
    {
        console.log("Object is undefined. Failed to save.");
        return;
    }
    try {
        await chrome.storage.local.set(objectToSave);
    }
    catch(error)
    {
        console.log("Failed to save object:", error);
    }
}



/*
    Retrieves information about the access token from chrome's local storage
    @param key: name of the object to load
    @return: an object containing the access token, token type, expiration time in seconds, scope of authorization, and refresh token
*/
export async function loadData(key)
{
    let result = undefined;
    try {
        result = await chrome.storage.local.get([key]);
    }
    catch(error)
    {
        console.log("Failed to retrive data:", error);
        return undefined;
    }
    if(!result[key]) return undefined;
    return result[key];
}



/*
    Deletes access token from chrome's local storage
    @param key: name of data object
    @return: none
*/
export async function deleteData(key)
{
    try {
        await chrome.storage.local.remove([key]);
    }
    catch(error)
    {
        console.log("Failed to delete data:", error);
    }
}