import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GitHubService } from '../services/github.service';

@ApiTags('github')
@Controller('github')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('issues')
  @ApiOperation({ summary: 'List repository issues' })
  async listIssues() {
    return this.githubService.listIssues('open');
  }

  @Get('issues/:number')
  @ApiOperation({ summary: 'Get specific issue' })
  async getIssue(@Param('number') number: number) {
    return this.githubService.getIssue(number);
  }

  @Post('issues')
  @ApiOperation({ summary: 'Create new issue for self-development' })
  async createIssue(
    @Body() body: { title: string; description?: string; labels?: string[] },
  ) {
    return this.githubService.createIssue(
      body.title,
      body.description,
      body.labels,
    );
  }

  @Get('commits')
  @ApiOperation({ summary: 'List recent commits' })
  async listCommits() {
    return this.githubService.listCommits();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check GitHub integration health' })
  async healthCheck() {
    try {
      await this.githubService.listCommits('main', 1);
      return {
        status: 'healthy',
        message: 'GitHub integration is working',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
