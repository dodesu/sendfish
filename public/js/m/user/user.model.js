const UserCrypto = await import('/assets/js/m/user/user.crypto.js');
const A_HOUR = 1000 * 60 * 60;
export default class User {
    #Id;
    #KeyPair = {};
    IdExpire;

    static async getOrCreate() {
        const res = await fetch('/api/id', { credentials: 'include' });
        const { hasInit, catId } = await res.json();
        //Fix later: don't fetch here
        const user = new User();
        let isUserCreated = true;

        if (hasInit && !user.isExpried()) {
            // Update, synchronize with cookies
            user.setId(catId);
            isUserCreated = false;
        }
        else {
            try {
                //note: should reset cylife in here. LocalStorage, indexedDB,..
                const { catId, publicKey, privateKey } = await UserCrypto.InitECDH();
                // Initialize ECDH key pair, register public key, and store private key in local storage

                user.setId(catId);
                user.#setKeyPair(publicKey, privateKey);
            } catch (error) {
                throw new Error('Initialization ECDH key pair failed!');
            }
        }

        console.log("ID = ", user.getId());
        return { user, isUserCreated };
    }

    getId() {
        return (this.#Id ?? localStorage.getItem('catId'));
    }
    setId(id) {
        this.IdExpire = Date.now() + A_HOUR;
        this.#Id = id;
        localStorage.setItem('IdExpire', this.IdExpire);
        localStorage.setItem('catId', id);
    }
    #setKeyPair(publicKey, privateKey) {
        localStorage.setItem('publicKey', publicKey);
        localStorage.setItem('privateKey', privateKey);

        this.#KeyPair.publicKey = publicKey;
        this.#KeyPair.privateKey = privateKey;
        //Fix: Encrypt private key before storage it(IndexedDB instead). Or just store in memory, exchange it with broadcast
    }
    getKeyPair() {
        return this.#KeyPair;
    }
    getPublicKey() {
        return this.#KeyPair.publicKey ?? localStorage.getItem('publicKey');
    }
    getPrivateKey() {
        return this.#KeyPair.privateKey ?? localStorage.getItem('privateKey');
    }
    isExpried() {
        return Date.now() > (this.IdExpire ?? localStorage.getItem('IdExpire'));
    }

}