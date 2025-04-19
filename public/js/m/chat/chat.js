import {
    importPublicKey,
    deriveSharedSecret,
    base64Converter,
} from '../../core/keyPair.js';
import { socket } from '../../core.js';
import { showToast } from '../toast.js';
/**
 * 
 * @param {ArrayBuffer} sharedSecret 
 * @returns 
 */
export const deriveAESKey = async (sharedSecret) => {
    return await crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "AES-GCM", length: 256 },
        false,
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

export const startPM = async (targetId) => {
    console.log('startPM', targetId);
    socket.emit('startPM', { targetId: targetId });
}

export const saveSharedSecret = async (targetPublicKey, roomId) => {
    try {
        const myPrivateKey = localStorage.getItem('privateKey');
        const importedPublicKey = await importPublicKey(targetPublicKey);
        const sharedSecret = await deriveSharedSecret(myPrivateKey, importedPublicKey);
        localStorage.setItem(roomId, sharedSecret);
    } catch (error) {
        showToast('Error generating shared secret', 'error');
        console.error("Error generating shared secret:", error);
    }
}