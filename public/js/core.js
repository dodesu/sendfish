import {
    ConnectSocket,
    onConnected,
    onDisconnect,
    onError,
    onSendFishStatus,
    onReceiveFish,
} from "./core/websocket.js";

const setupSocketEvents = (socket) => {
    socket.on('connect', () => onConnected(socket));
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('sendFishStatus', onSendFishStatus);
    socket.on('receiveFish', onReceiveFish);
};

const socket = ConnectSocket();
setupSocketEvents(socket);