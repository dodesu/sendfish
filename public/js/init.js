import {
    generateECDHKeyPair,
    exportPublicKey,
    // importPublicKey,
    // deriveSharedSecret,
    // base64Converter,
} from './m/keyPair.js';

(async function Init() {

    const KEY_PAIR = await generateECDHKeyPair();//the first time visit web

    const privateKey = await crypto.subtle.exportKey(
        "jwk",
        KEY_PAIR.privateKey
    );
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
                public_key: publicKey
            }), //send base64 of public key
        })

        //Check 
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error Init from server!');
        }

        const data = await res.json();
        //reuse in other tab or reload
        console.log(`ID = ${data.cat_id}`);
        localStorage.setItem('publicKey', JSON.stringify(publicKey));
        localStorage.setItem('privateKey', JSON.stringify(privateKey));
        localStorage.setItem('catId', data.cat_id);
        //Fix: Crypt private key before storage it(IndexedDB instead).
    } catch (error) {
        throw error;
    }
    //Next: Connect to websocket
})();