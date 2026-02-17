import { Module } from '@nestjs/common';
import { GitHubController } from '../controllers/github.controller';
import { GitHubService } from '../services/github.service';

@Module({
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
