import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'arq-redis',
          port: configService.get('REDIS_PORT') || 6379,
          maxRetriesPerRequest: null, // ЭТО ВАЖНО
        },
      }),
    }),
  ],
})
export class QueueModule {}
