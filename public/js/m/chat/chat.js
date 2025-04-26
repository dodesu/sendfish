import {
    importPublicKey,
    base64Converter,
    importPrivateKey,
} from '../../core/ECDHkeypair.js';
import { saveFish, genId } from "../history/chat-history.js";
let socket;

export const setSocket = (s) => {
    socket = s;
}

/**
 * Get the AES key from the shared secret. The shared secret is derived from the private key and the public key.
 * @param {CryptoKey} ownPrivateKey 
 * @param {CryptoKey} otherPublicKey 
 * @returns {CryptoKey} AES key
 */
const deriveAESKey = async (ownPrivateKey, otherPublicKey) => {
    const AESKey = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: otherPublicKey,
        },
        ownPrivateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
    return AESKey;
}
const exportAESKey = async (key) => {
    const exported = await crypto.subtle.exportKey("raw", key);
    return base64Converter(exported); // => Base64
}

/**
 * 
 * @param {String} key Base64 key 
 * @returns {CryptoKey} AES key
 */
export const importAESKey = async (key) => {
    const binaryKey = base64Converter(key, false);
    return await crypto.subtle.importKey(
        "raw",
        binaryKey.buffer,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}
/**
 * 
 * @param {CryptoKey} key 
 * @param {String} message 
 * @returns 
 */
export const encryptMsg = async (key, message) => {
    try {
        // Create Initialization Vector (IV) 
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            new TextEncoder().encode(message)
        );

        return {
            iv: base64Converter(iv),
            ciphertext: base64Converter(ciphertext)
        };
    } catch (error) {
        console.error("Error encrypt:", error);
        throw error;
    }
}

/**
 * 
 * @param {CryptoKey} AESkey 
 * @param {Uint8Array<ArrayBuffer>} iv 
 * @param {Uint8Array<ArrayBuffer>} ciphertext 
 * @returns 
 */
export const decryptMsg = async (AESkey, fishEcrypt) => {
    const { iv, ciphertext } = fishEcrypt;
    //Decoding base64 to ArrayBuffer
    const decodedIv = base64Converter(iv, false);
    const decodedCiphertext = base64Converter(ciphertext, false);
    try {
        const decryptedMsg = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: decodedIv // iv used to encrypt
            },
            AESkey,
            decodedCiphertext
        );

        // Convert the decoded ArrayBuffer to a plain text
        return new TextDecoder().decode(decryptedMsg);
    } catch (error) {
        console.error("Error decrypt:", error);
        throw error;
    }
}

export const startPM = async (receiver) => {
    const sender = localStorage.getItem('catId');
    console.log('startPM', receiver);
    socket.emit('startPM', { sender: sender, receiver: receiver });
}

/**
 *  * Generate a shared AES key using the server's response. And save it in localStorage.
 * @param {*} res Response from server. Event: startPM
 * @param {string} res.roomId Room ID for the chat.
 * @param {string} res.publicKey Public key of the other user.
 * @returns {string} AES key in base64 format.
 */
export const generateSharedAESKey = async (res) => {
    const { roomId, publicKey } = res;

    try {
        if (!roomId || !publicKey) {
            throw new Error("Invalid roomId or publicKey. Error from server.");
        }
        localStorage.setItem(roomId, publicKey);
        // Save the public key in localStorage for later use. If the user refreshes the page, we can still access it.
        const myPrivateKey = localStorage.getItem('privateKey'); //stringify
        if (!myPrivateKey) {
            throw new Error("Private key not found in localStorage.");
        }
        // Convert to CryptoKey object
        const myPrivateKeyObj = await importPrivateKey(myPrivateKey);
        const publicKeyObj = await importPublicKey(publicKey);
        // Generate AES key from the shared secret
        const AESkey = await deriveAESKey(myPrivateKeyObj, publicKeyObj);
        const AESkeyBase64 = await exportAESKey(AESkey);
        // Export the AES key to base64 format
        localStorage.setItem(roomId, AESkeyBase64);
        return AESkey; // Return the AES key for further use
    } catch (error) {
        throw error; // Rethrow the error for further handling
    }
}

export const sendFish = async (fishInfo) => {
    const { text, sender, receiver, roomId } = fishInfo;
    const AESkeyBase64 = localStorage.getItem(roomId);
    const AESkey = await importAESKey(AESkeyBase64);
    const fish_encrypt = await encryptMsg(AESkey, text);

    const id = await genId(roomId) + 1;
    const fish = {
        id: id,
        fishEncrypt: fish_encrypt,
        sender: sender,
        receiver: receiver,
        roomId: roomId,
    };

    await saveFish(fish);
    socket.emit('sendFish', fish);
    return `${roomId}${id}`;
}