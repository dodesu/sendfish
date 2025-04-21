export interface Fish {
    id: number;
    sender: string;
    receiver: string;
    message: string;
    time: Date | string;
}