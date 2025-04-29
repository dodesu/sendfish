import { handleStartPMStatus, handleReceiveFish, handlePendingFish } from "./chat.ui.js";


export const InitEvents = (socket) => {
    socket.on('startPMStatus', handleStartPMStatus);
    socket.on('receiveFish', handleReceiveFish);
    socket.on('pendingFish', handlePendingFish);
}