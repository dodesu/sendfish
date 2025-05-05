import { showToast } from "../utils/toast.js";

let Socket = null;

export const setSocket = (socket) => {
    Socket = socket;
}
/**
 *  Initialize WebSocket basic events
 */
export const InitBasicEventWS = () => {
    Socket.on('connect', onConnected);
    Socket.on('disconnect', onDisconnect);
    Socket.on('error', onError);
}

export const bindEventWS = (handlers) => {
    Socket.on('startPMStatus', handlers.startPMStatus);
    Socket.on('receiveFish', handlers.receiveFish);
    Socket.on('pendingFish', handlers.pendingFish);
}

const onConnected = () => {
    console.log('Connected to the server!');
    const catId = localStorage.getItem('catId');
    if (!catId) {
        throw new Error('catId not found in localStorage');
    }
    Socket.emit('register', { catId: localStorage.getItem('catId') });
};

const onError = (error) => {
    showToast(error.message, error.type || 'info');
}

const onDisconnect = () => {
    showToast('Lost connection to the server. Trying to reconnect...', 'warning');
}

