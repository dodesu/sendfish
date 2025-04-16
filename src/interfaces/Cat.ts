export interface Cat {
    socketId: string;
    name?: string;
    createAt: Date | string;
    expire?: number;
}