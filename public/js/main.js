let ECDHkeypairModule, WebSocketModule, ChatModule, ChatUI, ChatWS; // Declare modules to be used later

try {
    const res = await fetch('/api/id', { credentials: 'include' });
    const { hasInit, catId } = await res.json();
    await import('/js/m/toast.js');// Import toast module for notifications

    if (!hasInit) {
        try {
            ECDHkeypairModule = await import('/js/core/ECDHkeypair.js');
            ECDHkeypairModule.InitECDH(); // Initialize ECDH key pair, register public key, and store private key in local storage
        } catch (error) {
            console.error('Error importing keyPair or init:', error.message);
            throw new Error('Initialization failed!');
        }
    } else {
        // Update, synchronize with cookies
        localStorage.setItem('catId', catId);
    }

    try {
        WebSocketModule = await import('/js/core/websocket.js');
    } catch (error) {
        console.error('Error importing websocket:', error.message);
        throw new Error('Error importing websocket');
    }

    // Proceed with chat functionality
    try {
        ChatModule = await import('/js/m/chat/chat.js');
        ChatUI = await import('/js/m/chat/chat.ui.js');
        ChatWS = await import('/js/m/chat/chat.ws.js');
    } catch (error) {
        console.error('Error importing chat:', error.message);
        throw new Error('Chat functionality failed!');
    }



    const socket = WebSocketModule.ConnectSocket(); // Initialize WebSocket connection
    WebSocketModule.InitEvents(socket); // Initialize WebSocket events

    ChatModule.setSocket(socket); // Assign socket to Chat module
    ChatUI.InitUI(socket);
    ChatWS.InitEvents(socket); // Initialize WebSocket events for chat

} catch (error) {
    console.error('App bootstrapping failed:', error.message);
} finally {
    import('/js/load_animation.js');
}
