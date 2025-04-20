// import { io } from 'https://cdn.socket.io/4.0.1/socket.io.min.js';
import { showToast } from "../m/toast.js";
//Main method websocket
export const ConnectSocket = (url = 'http://localhost:3003') => {
    let socket = null;
    // Check if the URL is provided, if not, use the default URL
    const options = {
        reconnectionAttempts: 3,
        timeout: 5000
    };
    socket = io(url, options);
    return socket;
}

export const sendFish = (socket, data) => {
    if (!socket || !data) {
        throw new Error('Socket or data is not defined');
    }
    socket.emit('sendFish', data);
}



/**
 *  Initialize WebSocket basic events
 * @param {Socket} socket 
 */
export const InitEvents = (socket) => {
    socket.on('connect', () => onConnected(socket));
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
}


// Event callbacks
const onConnected = (socket) => {
    console.log('Connected to the server!');
    const catId = localStorage.getItem('catId');
    if (!catId) {
        throw new Error('catId not found in localStorage');
    }
    socket.emit('register', { catId: localStorage.getItem('catId') });
};

const onError = (error) => {
    showToast(error.message, error.type || 'info');
}

const onDisconnect = () => {
    showToast('Lost connection to the server. Trying to reconnect...', 'warning');
}