export interface Fish {
    id: number;
    senderCat: string;
    receiverCat: string;
    message: string;
    time: Date | string;
}