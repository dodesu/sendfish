const ChatUI = await import('/assets/js/m/chat/chat.ui.js');
const ChatModel = await import('/assets/js/m/chat/chat.model.js');
const ChatService = await import('/assets/js/m/chat/chat.service.js');
await import('/assets/js/m/chat/chat.crypto.js');
const {
    InitBasicEventWS,
    bindEventWS,
    setSocket } = await import('/assets/js/core/ws.handler.js');
import { showToast } from '../../utils/toast.js';
import { deriveRoomId } from '../../utils/utils.js';

let User = null;
let Socket = null;
export const Init = async (user, socket, isUserCreated) => {
    User = user;
    Socket = socket;
    await ChatModel.InitDB(isUserCreated);

    ChatService.setUp(user, socket);

    setSocket(socket); // Assign socket to websocket handler
    InitEventWS();

    ChatUI.InitUI();
    setUpEventUI();
    const activeChats = await ChatModel.getRoomsByType('active');
    const pendingChats = await ChatModel.getRoomsByType('pending');
    ChatUI.loadChats('active', activeChats);
    ChatUI.loadChats('pending', pendingChats);
    ChatUI.loadingCompleted();

}

/**
 * Handles loading a chat room by rendering all the messages in the room
 * @param {string} partner
 * @returns {Promise<void>}
 */
const onpenChat = async (partner) => {
    const current = User.getId();
    const roomId = deriveRoomId(current, partner);

    console.log('roomId = ', roomId);
    const messages = await ChatModel.getChats(roomId);
    for (const msg of messages) {
        const text = await ChatService.decryptFish(roomId, msg.fishEncrypted);
        const fishKey = `${roomId}${msg.id}`;
        if (msg.sender === current) {
            ChatUI.renderFish('sent', fishKey, text);
        }
        else {
            ChatUI.renderFish('received', fishKey, text);
        }
    }
}

const setUpEventUI = () => {
    const handlers = {
        startPM: ChatService.startPM,
        sendFish: ChatService.sendFish,
        updateRoom: ChatModel.updateRoom,
        openChat: onpenChat,
    };
    ChatUI.bindEventUI(handlers);
}

const InitEventWS = () => {
    InitBasicEventWS();
    const handlers = {
        startPMStatus: handleStartPMStatus,
        receiveFish: handleReceiveFish,
        pendingFish: handlePendingFish
    };
    bindEventWS(handlers);
}

/**
 * Handles the 'startPMStatus' WebSocket event.
 * 
 * @param {Object} res - The response object from the WebSocket event.
 * @param {string} res.roomId - The unique identifier for the chat room.
 * @param {string} res.publicKey - The public key of the partner.
 * @param {string} res.receiver - The ID of the chat receiver.
 */

const handleStartPMStatus = (res) => {
    const { roomId, publicKey, receiver } = res;
    try {
        ChatService.establishChatSharedKey(roomId, publicKey, receiver);
        ChatUI.newChat(receiver);
    } catch (error) {
        showToast(error.message, 'error');
    }
    showToast('New chat started!', 'success');
}

const handleReceiveFish = async (fish) => {
    const { id, roomId, sender, fishEncrypted } = fish;

    if (ChatUI.shouldIgnoreOwnMessage(sender)) {
        return;
    }

    try {
        ChatModel.saveFish(fish);
    } catch (error) {
        console.error("Error saving message to the database: ", error);
    }

    let fishText = await ChatService.decryptFish(roomId, fishEncrypted);
    const fishKey = `${roomId}${id}`;
    ChatUI.renderFish('received', fishKey, fishText);
};

export const handlePendingFish = async (fish) => {
    const { sender, roomId } = fish;

    try {
        const isAdded = await ChatModel.addRoom(roomId, 'pending', sender);
        if (isAdded) {
            ChatUI.addFishList('pending', sender);
        }

        await ChatModel.saveFish(fish);
    } catch (error) {
        console.error("Error saving message to the database: ", error);
    }
}