
/**
 * Serialize raw key to base64.
 * @param {ArrayBuffer} value 
 * @returns Base64 public key 
 */
export const binaryToBase64 = (value) => {
    return btoa(String.fromCharCode(...new Uint8Array(value)));
}

/**
 * Deserialize base64 key to raw key.
 * @param {string} value
 * @returns {ArrayBuffer} raw key
 */
export const base64ToBinary = (value) => {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

export const deriveRoomId = (a, b) => [a, b].sort().join('-')