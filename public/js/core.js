import {
    ConnectSocket,
    onConnected,
    onDisconnect,
    onError,
    onSendFishStatus,
    onReceiveFish,
} from "./core/websocket.js";

import { onStartPM } from "./m/chat/chat.ui.js";

const setupSocketEvents = (socket) => {
    socket.on('connect', () => onConnected(socket));
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('sendFishStatus', onSendFishStatus);
    socket.on('receiveFish', onReceiveFish);
    socket.on('startPM',);
};

export const socket = ConnectSocket();
setupSocketEvents(socket);