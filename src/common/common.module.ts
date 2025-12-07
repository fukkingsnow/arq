import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CacheService,
  BrowserService,
  EmailVerificationService,
  EventEmitterService,
  FileUploadService,
  LoggerService,
  RateLimitService,
  ValidationService
} from './services';
import { BrowserSession } from '../entities/browser-session.entity';
import { BrowserTab } from '../entities/browser-tab.entity';
import { BrowserRepository } from '../repositories/browser.repository';

const SERVICES = [
  BrowserService,
  CacheService,
  EmailVerificationService,
  EventEmitterService,
  FileUploadService,
  LoggerService,
  RateLimitService,
  ValidationService
];

const REPOSITORIES = [BrowserRepository];

@Module({
  imports: [TypeOrmModule.forFeature([BrowserSession, BrowserTab])],
  providers: [...SERVICES, ...REPOSITORIES],
  exports: [...SERVICES, ...REPOSITORIES]
})
export class CommonModule {}
