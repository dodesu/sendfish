export interface Fish {
    id: number;
    sender: string;
    receiver: string;
    roomId: string;
    fishEncrypted: { iv: string; ciphertext: string };
    time?: Date | string;
}