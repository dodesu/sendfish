import { binaryToBase64, base64ToBinary } from "../../utils/utils.js";
export async function InitECDH() {

    const KEY_PAIR = await generateECDHKeyPair();//the first time visit web

    const privateKey = await exportPrivateKey(KEY_PAIR.privateKey);
    const publicKey = await exportPublicKey(KEY_PAIR.publicKey);

    try {

        //Send public key to server
        const res = await fetch('/api/init', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicKey: publicKey
            }), //send base64 of public key
        })

        //Check 
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error Init from server!');
        }

        const data = await res.json();

        return {
            publicKey: publicKey,
            privateKey: privateKey,
            catId: data.cat_id
        };

    } catch (error) {
        throw error;
    }
    //Next: Connect to websocket
}


/**
 * 
 * @returns {Promise<CryptoKeyPair>} ECDHKeyPair to exchange, derive ASE key 
 */
const generateECDHKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256"
        }, true, ["deriveKey", "deriveBits"]
    );
    return keyPair;
}

/**
 * Serialize public key to base64. Before start exchanging the public key.
 * @param {CryptoKey} publicKey 
 * @returns Base64 public key from spki format.
 */
export const exportPublicKey = async publicKey => {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    return binaryToBase64(exported); // => Base64
}

/**
 * Decode the base64 public key to SPKI form. Before derive a shared secret.
 * @param {Base64} base64Key 
 * @returns {CryptoKey}
 */
export const importPublicKey = async base64Key => {
    const binaryKey = base64ToBinary(base64Key);
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
 * @returns {ArrayBuffer} sharedSecret.
 */
export const deriveSharedSecret = async (ownPrivateKey, otherPublicKey) => {
    const sharedSecret = await crypto.subtle.deriveBits(
        { name: "ECDH", public: otherPublicKey },
        ownPrivateKey,
        256
    );
    return sharedSecret;
}

/**
 *  Import the private key from local storage.
 * @param {stringify} privateKey 
 * @returns {jwk} CryptoKey
 */
export const importPrivateKey = async (privateKey) => {
    const jwk = JSON.parse(privateKey);
    return await crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256"
        },
        true, // extractable
        ["deriveKey", "deriveBits"]
    );
}

/**
 * Save the private key to local storage.
 * @param {CryptoKey} privateKey 
 * @returns {stringify} privateKey
 */
export const exportPrivateKey = async (privateKey) => {
    const exported = await crypto.subtle.exportKey("jwk", privateKey);
    return JSON.stringify(exported);
}