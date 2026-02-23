import { Controller, Get, Post, Body } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
const execAsync = promisify(exec);

@Controller('api/v1')
export class AppController {
  @Post('system/patch')
  async applyPatch(@Body() body: { code: string }) {
    try {
      const { stdout, stderr } = await execAsync(body.code);
      const log = `[${new Date().toLocaleTimeString()}] [PATCH]: ${body.code}\n`;
      fs.appendFileSync('/app/task_processing.log', log);
      return { status: 'success', output: stdout || stderr };
    } catch (e) {
      return { status: 'error', output: e.message };
    }
  }

  @Get('tasks')
  async getTasks() {
    try {
      const { stdout } = await execAsync('psql -U arq -d arq_db -c "SELECT json_agg(t) FROM (SELECT * FROM tasks ORDER BY id DESC LIMIT 10) t;" -t -A');
      return JSON.parse(stdout || '[]');
    } catch (e) { return []; }
  }

  @Post('tasks')
  async createTask(@Body() task: any) {
    await execAsync(`psql -U arq -d arq_db -c "INSERT INTO tasks (title, goal, description) VALUES ('${task.title}', '${task.goal}', '')"`);
    return { status: 'created' };
  }
}
