import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

let db = null;
export const initDB = async (hasInit) => {
    if (!hasInit) {
        indexedDB.deleteDatabase('chat-history');
    }

    db = await openDB('chat-history', 1, {
        upgrade(db) {
            const store = db.createObjectStore('messages');
            store.createIndex('roomId', 'roomId', { unique: false });
        }
    });
}

export const saveFish = async (fish) => {
    try {
        await db.add('messages', fish, `${fish.roomId}${fish.id}`);
    } catch (error) {
        throw error;
    }
}

export const genId = async (roomId) => {
    return await db.countFromIndex('messages', 'roomId', roomId);
}