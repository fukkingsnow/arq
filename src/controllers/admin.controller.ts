import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Response } from 'express';

const execAsync = promisify(exec);

@Controller('api/v1/admin')
export class AdminController {
  /**
   * Execute safe update script
   * POST /api/v1/admin/update-safe
   */
  @Post('/update-safe')
  async executeSafeUpdate(@Body() body: { branch?: string }, @Res() res: Response) {
    try {
      const branch = body.branch || 'main';
      const command = `cd /opt/arq && bash scripts/update-safe.sh ${branch}`;
      
      // Stream output in real-time
      const process = require('child_process').spawn('bash', ['-c', command]);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      process.stdout.on('data', (data: Buffer) => {
        res.write(`data: ${data.toString()}\n\n`);
      });
      
      process.stderr.on('data', (data: Buffer) => {
        res.write(`data: ERROR: ${data.toString()}\n\n`);
      });
      
      process.on('close', (code: number) => {
        res.write(`data: Process completed with code ${code}\n\n`);
        res.end();
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get system health status
   * GET /api/v1/admin/health
   */
  @Get('/health')
  async getHealth() {
    try {
      const { stdout } = await execAsync('curl -sf http://localhost:8888/health');
      return {
        status: 'healthy',
        backend: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        backend: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get update logs
   * GET /api/v1/admin/logs?limit=50
   */
  @Get('/logs')
  async getLogs() {
    try {
      const { stdout } = await execAsync('ls -lart /opt/arq/logs/update-*.log | tail -20');
      return {
        logs: stdout.split('\n').filter(l => l),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        logs: [],
        error: error instanceof Error ? error.message : 'No logs found',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current git status
   * GET /api/v1/admin/git-status
   */
  @Get('/git-status')
  async getGitStatus() {
    try {
      const { stdout: branch } = await execAsync('cd /opt/arq && git rev-parse --abbrev-ref HEAD');
      const { stdout: hash } = await execAsync('cd /opt/arq && git rev-parse --short HEAD');
      const { stdout: remoteHash } = await execAsync('cd /opt/arq && git rev-parse --short origin/main');
      
      return {
        branch: branch.trim(),
        localHash: hash.trim(),
        remoteHash: remoteHash.trim(),
        needsUpdate: hash.trim() !== remoteHash.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get git status',
        timestamp: new Date().toISOString()
      };
    }
  }
}
