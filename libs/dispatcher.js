events = [];

const addListener = (event, callback) => {
    // Check if the callback is not a function
    if (typeof callback !== 'function') {
        console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
        return false;
    }
    
    
    // Check if the event is not a string
    if (typeof event !== 'string') {
        console.error(`The event name must be a string, the given type is ${typeof event}`);
        return false;
    }
    
    // Check if this event not exists
    if (events[event] === undefined) {
        events[event] = {
            listeners: []
        }
    }
    
    events[event].listeners.push(callback);
}

const  removeListener = (event, callback) => {
    // Check if this event not exists
    if (events[event] === undefined) {
        console.error(`This event: ${event} does not exist`);
        return false;
    }
    
    events[event].listeners = events[event].listeners.filter(listener => {
        return listener.toString() !== callback.toString(); 
    });
}

const  removeAllListeners = (event) => {
    delete events[event];
}

const dispatch = (event, details) => {
    // Check if this event not exists
    if (events[event] === undefined) {
        console.error(`This event: ${event} does not exist`);
        return false;
    }
    
    events[event].listeners.forEach((listener) => {
        listener(details);
    });
}

const getListeners = () => {
    return events;
}

module.exports = {
    addListener,
    removeListener,
    removeAllListeners,
    dispatch,
    getListeners
}