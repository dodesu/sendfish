await import('/assets/libs/socket.io.min.js');
//Main method websocket
export default class WebSocket {
    Socket = null;

    constructor(url = 'http://localhost:3003') {
        let socket = null;
        // Check if the URL is provided, if not, use the default URL
        const options = {
            reconnectionAttempts: 3,
            timeout: 5000
        };
        this.Socket = io(url, options);
        return this.Socket;
    }
}
