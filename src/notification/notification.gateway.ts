
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private users = new Map<string, string>(); // Map<userId, socketId>

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.users.forEach((value, key) => {
      if (value === client.id) {
        this.users.delete(key);
      }
    });
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string): void {
    this.logger.log(`User registered: ${userId} with socket ${client.id}`);
    this.users.set(userId, client.id);
  }

  sendNotificationToUser(userId: string, notification: any): void {
    const socketId = this.users.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
