/*
    Processes a response from the spotify api
    @param response: the spotify response
    @param optionalMsgOnError: the error message to display upon failure
    @return the response data on success, undefined on failure
*/
export async function processResponse(response, optionalMsgOnError)
{
    if(response.ok)
    {
        return await response.json();
    }
    const error = (await response.json()).error;
    console.log(`${optionalMsgOnError || "Error."} Received error code ${error.status} - ${error.message}`);
    return undefined;
}