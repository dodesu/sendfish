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
let pendingStartPMRequest = [];
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

const InitEventWS = () => {
    InitBasicEventWS();
    const handlers = {
        startPMStatus: handleStartPMStatus,
        receiveFish: handleReceiveFish,
        pendingFish: handlePendingFish,
        fishStatus: handleFishStatus
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

const handleStartPMStatus = async (res) => {
    if (res.type !== 'success') {
        showToast(res.message, res.type === 'fail' ? 'error' : 'info');
        //Fix latter: this is shit.
        return;
    }

    const { roomId, publicKey, receiver } = res.data;
    try {
        await ChatService.establishChatSharedKey(roomId, publicKey, receiver);
        ChatUI.newChat(receiver);
    } catch (error) {
        showToast(error.message, 'error');
    }
    pendingStartPMRequest[roomId]?.();// Resolve the promise
    delete pendingStartPMRequest[roomId];
    // improve later

    showToast('New chat started!', 'success');
    User.addRoom(roomId);
}

const handleReceiveFish = async (fish) => {
    const { id, roomId, sender, fishEncrypted, timestamp } = fish;
    const localTime = new Date(timestamp).toLocaleString();
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
    ChatUI.renderFish('received', fishKey, localTime, fishText);
    acknowledgeFish(fishKey);
};

const handlePendingFish = async (fish) => {
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
    acknowledgeFish(`${roomId}${fish.id}`);
}

const acknowledgeFish = (keyId) => {
    ChatService.ackFish(keyId);
}

/**
 * Handles the 'fish:status' WebSocket event.
 * Updates the message status in the database. Additionally, it updates the status 
 * element on the UI only if the message is the last sent message.
 *
 * @param {Object} payload - An object containing the status information.
 */
const handleFishStatus = (payload) => {
    const keyIdFish = ChatUI.setFishStatus(payload);
    ChatModel.updateMessageStatus(keyIdFish, payload.status);
}

const setUpEventUI = () => {
    const handlers = {
        startPM: ChatService.startPM,
        sendFish: ChatService.sendFish,
        prepareChat: prepareChat,
    };
    ChatUI.bindEventUI(handlers);
}
/**
 * Handles loading a chat room by rendering all the messages in the room.
 * Case: User already exchanged public keys, and has AES key. 
 * @param {string} partner
 * @returns {Promise<void>}
 */
const openChat = async (roomId) => {
    const current = User.getId();
    //This ID may be incorrect if loading a chat archive

    const messages = await ChatModel.getChats(roomId);
    for (const msg of messages) {
        const text = await ChatService.decryptFish(roomId, msg.fishEncrypted);
        const fishKey = `${roomId}${msg.id}`;
        const localTime = new Date(msg.timestamp).toLocaleString();
        if (msg.sender === current) {
            ChatUI.renderFish('sent', fishKey, localTime, text);
        }
        else {
            ChatUI.renderFish('received', fishKey, localTime, text);
        }
    }
}

/**
 * Initiates the process to open a chat with a partner by sending a startPM request
 * to establish a new chat room, waiting for the chat setup to complete, and then
 * loading the chat messages for the room.
 *
 * This function sends a 'startPM' request to initiate the creation of a chat room,
 * waits for a response via the 'startPMStatus' WebSocket event to resolve the chat
 * setup, and then opens the chat by loading all messages in the room. It also updates
 * the room type to 'active' in the chat model once the chat is successfully opened.
 *
 * @param {string} partner - The ID of the chat partner to establish a chat with.
 * @param {string} roomId - The unique identifier for the chat room.
 * @returns {Promise<void>}
 */
const prepareChat = async (partner, roomId) => {
    if (!User.isInRoom(roomId)) {
        const chatResult = new Promise((resolve, reject) => {
            ChatService.startPM(partner);
            pendingStartPMRequest[roomId] = resolve;

            setTimeout(() => {
                reject();
            }, 5000);
            //Fix later: make reject sync with startPMStatus event
        });

        try {
            await chatResult
        } catch (error) {
            console.error('Chat setup timed out.');
        }
    }

    await openChat(roomId);
    ChatModel.updateRoom(roomId, 'active', partner);
}