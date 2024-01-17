/*
    Delays and prevents a function from executing multiple times within
    a time window defined by the timeout
    @param func: the func to debounce
    @param timeout: default 200ms, time to debounce the function by in milliseconds
    @return the debounced function
*/
function debounce(func, timeout = 200) 
{
    let timer;
    return (...args) => 
    {
        clearTimeout(timer);
        timer = setTimeout(() =>
        {
            func.apply(this, args);
        }, timeout)
    }
}
