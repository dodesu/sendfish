import {
    importPublicKey,
    deriveSharedSecret,
    base64Converter,
    importPrivateKey,
} from '../../core/ECDHkeypair.js';
let socket;

export const setSocket = (s) => {
    socket = s;
}

/**
 * 
 * @param {ArrayBuffer} sharedSecret 
 * @returns {string} AES key in base64 format.
 */
export const deriveAESKey = async (sharedSecret) => {
    const AESKey = await crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
    return base64Converter(AESKey);
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
        return null;
    }
}

/**
 * 
 * @param {CryptoKey} AESkey 
 * @param {Uint8Array<ArrayBuffer>} iv 
 * @param {Uint8Array<ArrayBuffer>} ciphertext 
 * @returns 
 */
export const decryptMsg = async (AESkey, fish) => {
    const { iv, ciphertext } = fish;
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
        return null;
    }
}

export const startPM = async (receiveCat) => {
    const senderCat = localStorage.getItem('catId');
    console.log('startPM', receiveCat);
    socket.emit('startPM', { senderCat: senderCat, receiveCat: receiveCat });
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
        const sharedSecret = await deriveSharedSecret(myPrivateKeyObj, publicKeyObj);
        // Generate AES key from the shared secret
        const AESkey = await deriveAESKey(sharedSecret);
        localStorage.setItem(roomId, AESkey);
        return AESkey; // Return the AES key for further use
    } catch (error) {
        throw error; // Rethrow the error for further handling
    }
}