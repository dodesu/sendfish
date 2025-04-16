// import { io } from 'https://cdn.socket.io/4.0.1/socket.io.min.js';
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


// Event callbacks
export const onConnected = (socket) => {
    console.log('Kết nối thành công!');
    const catId = localStorage.getItem('catId');
    if (!catId) {
        throw new Error('catId not found in localStorage');
    }
    socket.emit('register', { catId: localStorage.getItem('catId') });
};

export const onError = (error) => {
    console.error('Error ws:', error.message);
}

export const onDisconnect = () => {
    console.log('Conection was closed!');
}
export const onSendFishStatus = (event) => {
    console.log('sendFishStatus:', event.message);
}

export const onReceiveFish = (fish) => {
    console.log('receiveFish:', fish);
}