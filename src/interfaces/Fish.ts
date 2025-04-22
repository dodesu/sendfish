export interface Fish {
    id: number;
    sender: string;
    receiver: string;
    roomId: string;
    fishEncrypt: { iv: string; ciphertext: string };
    time?: Date | string;
}