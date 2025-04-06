/**
 * 
 * @param {ArrayBuffer} sharedSecret 
 * @returns 
 */
const deriveAESKey = async (sharedSecret) => {
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
const encryptMsg = async (key, message) => {
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
            iv: iv,
            ciphertext: new Uint8Array(ciphertext)
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
const decryptMsg = async (AESkey, iv, ciphertext) => {
    try {
        const decryptedMsg = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv // iv used to encrypt
            },
            AESkey,
            ciphertext
        );

        // Convert the decoded ArrayBuffer to a plain text
        return new TextDecoder().decode(decryptedMsg);
    } catch (error) {
        console.error("Error decrypt:", error);
        return null;
    }
}


module.exports = { deriveAESKey, encryptMsg, decryptMsg };


