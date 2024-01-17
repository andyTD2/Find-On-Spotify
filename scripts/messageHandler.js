
/*
    A class that will call the corresponding function to a given request
*/
export class messageHandler
{
    /*
        Constructor optionally takes an object with predefined keys and functions
    */
    constructor(handlerFunctions = {}) {
        this.messageHandler = {...handlerFunctions};
    }


    /*
        Add new key with corresponding function
        @param key: The key to match in order to call function
        @param handler: function to execute on match
    */
    addNewHandlerFunction(key, handler)
    {
        if(typeof handler !== 'function')
            throw "Expected handler to be of type function"

        this.messageHandler[key] = handler;
    }

    /*
        Call function given key and function params
        @param params: an object that contains at a minimum:
            request: the request to match a key against
            sender: the chrome tab that sent the message
            sendResponse: chrome function to send a response
    */
    handleFunction(params)
    {
        let handlerFunction = this.messageHandler[params.request];
        handlerFunction(params);
    }
}