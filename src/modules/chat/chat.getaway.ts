import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Cat } from 'src/interfaces/Cat';
import { Fish } from 'src/interfaces/Fish';


@WebSocketGateway({
    cors: {
        origin: ['http://localhost:3003', 'http://127.0.0.1:3003'],
        credentials: true,
    }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private readonly server: Server;

    private _activeCats = new Map<string, Cat>();
    private _roomCount = new Map<string, number>();
    constructor(private readonly _redisService: RedisService) { };

    handleConnection(catSocket: Socket) {
        console.info(`🔌Cat connected: ${catSocket.id}`);
    }

    handleDisconnect(catSocket: Socket) {
        console.info(`❌ Client disconnected:  ${catSocket.id}`);
        for (const [catId, cat] of this._activeCats.entries()) {
            if (cat.socketId === catSocket.id) {
                this._activeCats.delete(catId);
                break;
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(@MessageBody() data: { catId: string }, @ConnectedSocket() catSocket: Socket) {
        //Fix me: If server is restarted, the cookie cat_id is still valid. Can send public key (localStorage) to save in redis if want reuse cat_id.
        if (this._activeCats.has(data.catId)) {
            this.server.to(catSocket.id).emit('error', { type: 'error', message: 'You are already registered' });
            return;
        }
        const cat: Cat = {
            socketId: catSocket.id,
            createAt: new Date()
        };
        this._activeCats.set(data.catId, cat);
        console.info(`✅ Registered cat id: ${data.catId} -> socket id: ${catSocket.id}`);
    }

    @SubscribeMessage('startPM')
    async handleStartPM(@MessageBody() data: { sender: string, receiver: string }, @ConnectedSocket() catSocket: Socket) {
        const { sender, receiver } = data;
        const targetCat = this._activeCats.get(receiver);
        if (!targetCat) {
            this.server.to(catSocket.id).emit('error', { type: 'error', message: 'Target cat id not found!' });
            return;
        }

        //Check if the sender use other's id
        const confirm = this._activeCats.get(sender)?.socketId === catSocket.id;
        if (!confirm) {
            this.server.to(catSocket.id).emit('error', { type: 'error', message: 'You are cheating!' });
            return;
        }

        // Check if the sender is the same as the receiver
        if (sender === receiver) {
            this.server.to(catSocket.id).emit('error', { type: 'error', message: 'You cannot send fish to yourself!' });
            return;
        }

        const roomId = `${[sender, receiver].sort().join('-')}`;
        if (catSocket.rooms.has(roomId)) {
            // If the room already exists, no need to join again
            return this.server
                .to(catSocket.id)
                .emit('error', {
                    type: 'info',
                    message: 'You are already in your fish basket list'
                });
        }

        const publicKey = await this._redisService.get(receiver);
        // Check if the public key is available
        if (!publicKey) {
            this.server.to(catSocket.id).emit('error', { type: 'error', message: `Target's public key not found!` });
            return;
        }
        catSocket.join(roomId);
        this.server.to(catSocket.id).emit('startPMStatus', { roomId, publicKey, receiver });
    }

    @SubscribeMessage('sendFish')
    handleSendFish(@MessageBody() fish: Fish, @ConnectedSocket() catSocket: Socket) {

        const { receiver, roomId } = fish;
        // Check if data is valid
        if (!fish) {
            this.server
                .to(catSocket.id)
                .emit('sendFishStatus', { roomId: roomId, status: 'error', message: 'Invalid fish data!' });
            return;
        }

        const receiverSocket = this._activeCats.get(receiver)?.socketId;
        //Check if receiver is online
        if (!receiverSocket) {
            this.server
                .to(catSocket.id)
                .emit('sendFishStatus', { roomId: roomId, status: 'undelivered', message: 'That cat is not online!' });
            return;
        }

        // If both sender and receiver are in the room, send the fish directly
        // If not, send the fish to the receiver's socket directly
        const bothInRoom = this.isSocketInRoom(roomId, catSocket.id, receiverSocket);
        this.server.to(catSocket.id).emit('error', { type: 'info', message: `That cat ${bothInRoom ? 'was' : 'not'} in room.` });
        fish.time = new Date().toISOString(); //If set in the client, it can be duplicated
        const count = this._roomCount.get(roomId) ?? 0;
        fish.id = fish.id !== count + 1 ? count + 1 : fish.id;
        if (bothInRoom) {
            this.server.to(roomId).emit('receiveFish', fish);
        } else {
            this.server.to(receiverSocket).emit('wattingFish', fish);
        }
        this._roomCount.set(roomId, fish.id);
        // Notify the sender that the fish has been sent
        this.server
            .to(receiverSocket)
            .emit('sendFishStatus', { roomId: roomId, status: 'sent' });
    }

    private isSocketInRoom(roomId: string, sender: string, receiver?: string): boolean {
        const room = this.server.sockets.adapter.rooms.get(roomId);
        if (receiver) {

            return (room?.has(sender) && room?.has(receiver)) ?? false;
        }
        return room?.has(sender) ?? false;
    }
}