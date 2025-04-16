import {
    ConnectSocket,
    onConnected,
    onDisconnect,
    onError,
    onSendFishStatus,
    onReceiveFish,
} from "./m/websocket.js";

const socket = ConnectSocket();

const setupSocketEvents = (socket) => {
    socket.on('connect', () => onConnected(socket));
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('sendFishStatus', onSendFishStatus);
    socket.on('receiveFish', onReceiveFish);
};

setupSocketEvents(socket);