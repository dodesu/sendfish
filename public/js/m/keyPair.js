/**
 * 
 * @returns {Promise<CryptoKeyPair>} ECDHKeyPair to exchange, derive ASE key 
 */
export const generateECDHKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256"
        }, true, ["deriveKey", "deriveBits"]
    );
    return keyPair;
}

/**
 * Encode SPKI public key to base64, and vice versa (with 2nd param). 
 * @param {ArrayBuffer|Base64} value 
 * @param {boolean} isDecode 
 * @returns 
 */
export const base64Converter = (value, isDecode = true) => {
    if (isDecode) {
        return btoa(String.fromCharCode(...new Uint8Array(value)));
    }

    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

/**
 * Serialize public key to base64. Before start exchanging the public key.
 * @param {CryptoKey} publicKey 
 * @returns Base64 public key from spki format.
 */
export const exportPublicKey = async publicKey => {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    return base64Converter(exported); // => Base64
}

/**
 * Decode the base64 public key to SPKI form. Before derive a shared secret.
 * @param {Base64} base64Key 
 * @returns {CryptoKey}
 */
export const importPublicKey = async base64Key => {
    const binaryKey = base64Converter(base64Key, false);
    return await crypto.subtle.importKey(
        "spki",
        binaryKey.buffer,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );
}
/**
 * @description 
 * Base64's secret key has derived the exchanged public key.
 * @param {*} ownPrivateKey 
 * @param {*} otherPublicKey 
 * @returns Base64 sharedSecret.
 */
export const deriveSharedSecret = async (ownPrivateKey, otherPublicKey) => {
    const sharedSecret = await crypto.subtle.deriveBits(
        { name: "ECDH", public: otherPublicKey },
        ownPrivateKey,
        256
    );
    return base64Converter(sharedSecret);
}