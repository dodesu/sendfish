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
        const cat: Cat = {
            socketId: catSocket.id,
            createAt: new Date()
        };
        this._activeCats.set(data.catId, cat);
        console.info(`✅ Registered cat id: ${data.catId} -> socket id: ${catSocket.id}`);
    }

    @SubscribeMessage('startPM')
    handleStartPM(@MessageBody() data: { targetId: string }, @ConnectedSocket() catSocket: Socket) {
        const targetCat = this._activeCats.get(data.targetId);
        if (!targetCat) {
            catSocket.to(catSocket.id).emit('error', { message: 'Target cat id not found!' });
            return;
        }

        const roomId = `${[catSocket.id, data.targetId].sort().join('-')}`;
        if (catSocket.rooms.has(roomId)) {
            // If the room already exists, no need to join again
            return;
        }

        const publicKey = this._redisService.get(data.targetId);
        if (!publicKey) {
            catSocket.to(catSocket.id).emit('error', { message: 'Public key not found!' });
            return;
        }
        catSocket.join(roomId);
        catSocket.to(catSocket.id).emit('startPM', { roomId, publicKey });
    }

    @SubscribeMessage('sendFish')
    handleSendFish(@MessageBody() fish: Fish, @ConnectedSocket() catSocket: Socket) {
        // Check if data is valid
        if (!fish) {
            this.server
                .to(catSocket.id)
                .emit('error', { message: 'Invalid fish data!' });
            return;
        }

        const { senderCat, receiverCat } = fish;
        const roomId = `${[senderCat, receiverCat].sort().join('-')}`;
        const receiverCatSocket = this._activeCats.get(receiverCat)?.socketId;
        //Check if receiverCat is online
        if (!receiverCatSocket) {
            this.server
                .to(catSocket.id)
                .emit('error', { message: 'Receiver cat is not online!' });
            return;
        }

        // If both sender and receiver are in the room, send the fish directly
        // If not, send the fish to the receiver's socket directly
        const bothInRoom = this.isSocketInRoom(roomId, senderCat, receiverCat);
        fish.time = new Date().toISOString(); //If set in the client, it can be duplicated
        if (bothInRoom) {
            this.server.to(roomId).emit('receiveFish', fish);
        } else {
            this.server.to(receiverCatSocket).emit('wattingFish', fish);
        }
        this.server
            .to(receiverCatSocket)
            .emit('sendFishStatus', { message: 'Delivered' });
    }
    private isSocketInRoom(roomId: string, senderCat: string, receiverCat?: string): boolean {
        const room = this.server.sockets.adapter.rooms.get(roomId);
        if (receiverCat) {

            return (room?.has(senderCat) && room?.has(receiverCat)) ?? false;
        }
        return room?.has(senderCat) ?? false;
    }
}