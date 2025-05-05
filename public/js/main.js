await import('/assets/js/utils/utils.js');
await import('/assets/js/utils/toast.js');
const User = (await import('/assets/js/m/user/user.model.js')).default;
const WebSocket = (await import('/assets/js/core/websocket.js')).default;
const ChatController = await import('/assets/js/m/chat/chat.controller.js');

async function bootstrap() {
    const { user, isUserCreated } = await User.getOrCreate();
    const socket = new WebSocket();

    ChatController.Init(user, socket, isUserCreated);

}
bootstrap();


