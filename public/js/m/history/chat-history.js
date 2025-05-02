import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

let db = null;
export const initDB = async (hasInit) => {
    if (!hasInit) {
        indexedDB.deleteDatabase('chat-history');
    }

    db = await openDB('chat-history', 1, {
        upgrade(db) {
            const roomStore = db.createObjectStore('rooms', { keyPath: 'roomId' });
            roomStore.createIndex('type', 'type', { unique: false });

            const messagesStore = db.createObjectStore('messages');
            messagesStore.createIndex('roomId', 'roomId', { unique: false });
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

export const getRoomsByType = async (type) => {
    try {
        const rooms = await db.getAllFromIndex('rooms', 'type', type);
        return rooms.map(({ type, ...rest }) => rest);
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const addRoom = async (roomId, type, partner) => {
    try {
        await db.add('rooms', { roomId: roomId, type: type, partner: partner });
    } catch (error) {
        if (error.name === 'ConstraintError') {
            return false;
        }
        console.error(error);
    }
    return true;
}

export const updateRoom = async (roomId, type, partner) => {
    try {
        await db.put('rooms', { roomId: roomId, type: type, partner: partner });
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