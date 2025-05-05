import { showToast } from "../../utils/toast.js";
import {
    saveFish,
    addRoom,
    countMessagesInRoom
} from "./chat.model.js";

import {
    importPrivateKey,
    importPublicKey
} from "../user/user.crypto.js";

import {
    generateSharedAESKey,
    importAESKey,
    encryptMessage,
    decryptMessage
} from "./chat.crypto.js";

let User;
let Socket;

export const setUp = (user, socket) => {
    User = user;
    Socket = socket;
}

export const startPM = async (receiver) => {
    const sender = User.getId();
    console.log('start a chat with ', receiver);
    Socket.emit('startPM', { sender: sender, receiver: receiver });
}

export const handleStartPMStatus = async (res, newChat) => {
    const { roomId, publicKey, receiver } = res;
    // Update the URL without reloading the page

    try {
        const privateKey = User.getPrivateKey(); //stringify
        if (!privateKey) {
            throw new Error("Private key not found!");
        }
        // Convert to CryptoKey object
        const privateKeyObj = await importPrivateKey(privateKey);
        const publicKeyObj = await importPublicKey(publicKey);

        const AESkeyBase64 = await generateSharedAESKey(privateKeyObj, publicKeyObj);
        localStorage.setItem(roomId, AESkeyBase64);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Error generating shared AES key:', error);
        return;
    }


    newChat(receiver);
    try {
        await addRoom(roomId, 'active', receiver);
    } catch (error) {
        console.error(error);
    }
    showToast('New chat started!', 'success');
}

export const sendFish = async (fishInfo) => {
    const { text, sender, receiver, roomId } = fishInfo;
    let fish_encrypt;
    try {
        const AESkey = await getAesKey(roomId);
        fish_encrypt = await encryptMessage(AESkey, text);
    } catch (error) {
        throw error;
    }

    const id = await countMessagesInRoom(roomId) + 1;
    const fish = {
        id: id,
        fishEncrypted: fish_encrypt,
        sender: sender,
        receiver: receiver,
        roomId: roomId,
        status: 'delivered'
    };

    await saveFish(fish);
    //note: save in response better
    delete fish.status;
    // Don't send the status to the receiver
    Socket.emit('sendFish', fish);
    return `${roomId}${id}`;
}

export const decryptFish = async (roomId, fishEncrypted) => {
    let fishText = '';
    try {
        const AESkey = await getAesKey(roomId);
        fishText = await decryptMessage(AESkey, fishEncrypted);
    } catch (error) {
        console.error("Error decrypting message", error);
    }
    return fishText;
}

//Utils functions
const getAesKey = async (roomId) => {
    const AesKeyBase64 = localStorage.getItem(roomId);
    const AesKey = await importAESKey(AesKeyBase64);
    return AesKey;
}