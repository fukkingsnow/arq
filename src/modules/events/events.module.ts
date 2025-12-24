import { Module } from '@nestjs/common';
import { QueueModule } from '../../queue';
import { TaskEventsGateway } from './task-events.gateway';

@Module({
  imports: [QueueModule],
  providers: [TaskEventsGateway],
  exports: [TaskEventsGateway],
})
export class EventsModule {}
