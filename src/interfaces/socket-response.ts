export interface SocketResponse<T = any> {
    type: 'success' | 'fail' | 'info';
    data: T | null;
    message?: string;
}