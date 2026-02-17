import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TaskConsumerService } from '../../queue';

@WebSocketGateway({
  namespace: '/tasks',
  cors: true,
})
export class TaskEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private taskConsumerService: TaskConsumerService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connection', {
      message: 'Connected to task events gateway',
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:task')
  async handleTaskSubscription(
    client: Socket,
    payload: { taskId: string },
  ): Promise<void> {
    const taskId = payload.taskId;
    const room = `task_${taskId}`;
    
    client.join(room);
    console.log(`Client ${client.id} subscribed to ${room}`);
    
    // Send initial task status
    const status = await this.taskConsumerService.getTaskStatus(taskId);
    if (status) {
      client.emit('task:status', {
        taskId,
        status: status.state,
        progress: status.progress,
        data: status.data,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('unsubscribe:task')
  handleTaskUnsubscription(
    client: Socket,
    payload: { taskId: string },
  ): void {
    const taskId = payload.taskId;
    const room = `task_${taskId}`;
    
    client.leave(room);
    console.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  // Method to broadcast task status updates
  broadcastTaskStatus(
    taskId: string,
    status: string,
    progress: number,
    data?: any,
  ): void {
    const room = `task_${taskId}`;
    this.server.to(room).emit('task:status', {
      taskId,
      status,
      progress,
      data,
      timestamp: new Date(),
    });
  }

  // Method to broadcast task completion
  broadcastTaskCompletion(
    taskId: string,
    result: any,
  ): void {
    const room = `task_${taskId}`;
    this.server.to(room).emit('task:completed', {
      taskId,
      result,
      timestamp: new Date(),
    });
  }

  // Method to broadcast task errors
  broadcastTaskError(
    taskId: string,
    error: string,
  ): void {
    const room = `task_${taskId}`;
    this.server.to(room).emit('task:error', {
      taskId,
      error,
      timestamp: new Date(),
    });
  }
}
