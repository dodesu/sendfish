import { handleStartPMStatus } from "./chat.ui.js";


export const InitEvents = (socket) => {
    socket.on('startPMStatus', handleStartPMStatus);
    // Add other event listeners here as needed
}

const sendFish = (fish_text) => {

}