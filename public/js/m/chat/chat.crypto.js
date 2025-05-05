import { binaryToBase64, base64ToBinary } from "../../utils/utils.js";
export const encryptMessage = async (key, message) => {
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
            iv: binaryToBase64(iv),
            ciphertext: binaryToBase64(ciphertext)
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
export const decryptMessage = async (AESkey, fishEcrypt) => {
    const { iv, ciphertext } = fishEcrypt;
    //Decoding base64 to ArrayBuffer
    const decodedIv = base64ToBinary(iv);
    const decodedCiphertext = base64ToBinary(ciphertext);
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

export const generateSharedAESKey = async (privateKey, otherPublicKey) => {
    try {
        // Generate AES key from the shared secret
        const AESkey = await deriveAESKey(privateKey, otherPublicKey);
        const AESkeyBase64 = await exportAESKey(AESkey);
        // Export the AES key to base64 format
        return AESkeyBase64;
    } catch (error) {
        throw error; // Rethrow the error for further handling
    }
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

/**
 * 
 * @param {String} key Base64 key 
 * @returns {CryptoKey} AES key
 */
export const importAESKey = async (key) => {
    const binaryKey = base64ToBinary(key);
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
const exportAESKey = async (key) => {
    const exported = await crypto.subtle.exportKey("raw", key);
    return binaryToBase64(exported); // => Base64
}


