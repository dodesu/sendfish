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

/**
 * Generates a shared AES key for a given chat room, using the user's private key
 * and the receiver's public key. Then save it.
 * @param {string} roomId - The room ID
 * @param {string} publicKey - The receiver's public key
 * @param {string} receiver - The receiver's ID
 * @returns {Promise<void>}
 */
export const establishChatSharedKey = async (roomId, publicKey, receiver) => {
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
        console.error('Error generating shared AES key:', error);
        throw error;
    }

    try {
        await addRoom(roomId, 'active', receiver);
    } catch (error) {
        console.error('Error adding room: ', error);
        throw error;
    }
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
        throw new Error("Error decrypting message", { cause: error });
    }
    return fishText;
}

//Utils functions
const getAesKey = async (roomId) => {
    const AesKeyBase64 = localStorage.getItem(roomId);
    const AesKey = await importAESKey(AesKeyBase64);
    return AesKey;
}