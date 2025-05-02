import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

let db = null;
export const initDB = async (hasInit) => {
    if (!hasInit) {
        indexedDB.deleteDatabase('chat-history');
    }

    db = await openDB('chat-history', 1, {
        upgrade(db) {
            const roomStore = db.createObjectStore('rooms', { keyPath: 'roomId' });
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

export const getChatList = async () => {
    const rooms = await db.getAll('rooms');
    return rooms.map(room => room.roomId);
}

export const addRoom = async (roomId, type) => {
    try {
        await db.add('rooms', { roomId: roomId, type: type });
    } catch (error) {
        if (error.name === 'ConstraintError') {
            return false;
        }
        console.error(error);
    }
    return true;
}

export const updateRoom = async (roomId, type) => {
    try {
        await db.put('rooms', { roomId: roomId, type: type });
    } catch (error) {
        console.error(error);
    }
}

export const delRoom = async (roomId) => {
    try {
        await db.delete('rooms', roomId);
    } catch (error) {
        console.error(error);
    }
}