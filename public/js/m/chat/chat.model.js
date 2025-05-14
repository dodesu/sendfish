import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

let db = null;
/**
 * Initialize IndexedDB database for chat history
 * @param {boolean} isUserCreated - Whether the user has just been created. Then reset the database
 */
export const InitDB = async (isUserCreated) => {
    if (isUserCreated) {
        indexedDB.deleteDatabase('chat-history');
    }

    db = await openDB('chat-history', 1, {
        upgrade(db) {
            const roomStore = db.createObjectStore('rooms', { keyPath: 'roomId' });
            roomStore.createIndex('type', 'type', { unique: false });

            const messagesStore = db.createObjectStore('messages');
            messagesStore.createIndex('roomId', 'roomId', { unique: false });
            messagesStore.createIndex('roomId_id', ['roomId', 'id']);
        }
    });
}

/**
 * Saves a message to the 'messages' object store in IndexedDB.
 * The message is identified by a composite key of the room ID and the message ID.
 * @param {Object} fish - A message object 
 */
export const saveFish = async (fish) => {
    try {
        await db.add('messages', fish, `${fish.roomId}${fish.id}`);
    } catch (error) {
        throw error;
    }
}

/**
 * Counts the number of messages in a specified room.
 * @param {string} roomId - The ID of the room to count messages for.
 * @returns {Promise<number>} - A promise that resolves to the count of messages in the room.
 */

export const countMessagesInRoom = async (roomId) => {
    return await db.countFromIndex('messages', 'roomId', roomId);
}

/**
 * Retrieves all rooms of a specified type from IndexedDB.
 * @param {string} type - The type of room to retrieve (e.g. 'active', 'pending').
 * @returns {Promise<Object[]>} - A promise that resolves to an array of room objects. Each room object has a 'roomId' and 'partner' property.
 */
export const getRoomsByType = async (type) => {
    try {
        const rooms = await db.getAllFromIndex('rooms', 'type', type);
        return rooms.map(({ type, ...rest }) => rest);
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Adds a new room to the 'rooms' object store in IndexedDB.
 * Returns true if the room was added successfully, false if the room already exists.
 * @param {string} roomId - The ID of the room to add.
 * @param {string} type - The type of room to add (e.g. 'active', 'pending').
 * @param {string} partner - The partner ID associated with the room.
 * @returns {Promise<boolean>}
 */
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
/**
 * Currently, this just use for updates the room's type. And I don't should to check if the room exists or not.
 */
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

/**
 * Get all messages in a room by roomId, sort by id
 * @param {string} roomId
 * @returns {Promise<Message[]>}
 */
export const getChats = async (roomId) => {
    try {
        const index = db.transaction('messages').store.index('roomId_id');
        const range = IDBKeyRange.bound([roomId], [roomId, '\uffff']);
        const messages = await index.getAll(range);

        return messages;
    } catch (error) {
        console.error(error);
        return null;
    }
}