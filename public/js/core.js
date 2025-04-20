import {
    ConnectSocket,
    onConnected,
    onDisconnect,
    onError,
    onSendFishStatus,
    onReceiveFish,
} from "./core/websocket.js";

import { onStartPMStatus } from "./m/chat/chat.ui.js";

const setupSocketEvents = (socket) => {
    socket.on('connect', () => onConnected(socket));
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('sendFishStatus', onSendFishStatus);
    socket.on('receiveFish', onReceiveFish);
    socket.on('startPMStatus', onStartPMStatus);
};

export const socket = ConnectSocket();
setupSocketEvents(socket);