try {
    const res = await fetch('/api/id', { credentials: 'include' });
    const { hasInit } = await res.json();

    if (!hasInit) {
        try {
            await import('/js/core/keyPair.js');
            await import('/js/init.js');
        } catch (error) {
            console.error('Error importing keyPair or init:', error.message);
            throw new Error('Initialization failed!');
        }

    }
    await import('/js/m/toast.js');
    // Proceed with WebSocket connection
    try {

        await import('/js/core/websocket.js');
        await import('/js/core.js');
    } catch (error) {
        console.error('Error importing websocket or core:', error.message);
        throw new Error('WebSocket connection failed!');
    }

    // Proceed with chat functionality
    try {
        await import('/js/m/chat/index.js');
    } catch (error) {
        console.error('Error importing chat:', error.message);
        throw new Error('Chat functionality failed!');
    }

} catch (error) {
    console.error('App bootstrapping failed:', error.message);
} finally {
    import('/js/load_animation.js');
}
