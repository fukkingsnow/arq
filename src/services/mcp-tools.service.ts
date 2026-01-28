import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class ArqMcpTools {
  // Инструмент для выполнения команд в консоли сервера
  @Tool({
    name: 'execute_command',
    description: 'Выполняет shell-команды на сервере Beget (npm test, git status и т.д.)',
    parameters: z.object({
      command: z.string(),
    }),
  })
  async executeCommand({ command }: { command: string }) {
    try {
      const { stdout, stderr } = await execAsync(command);
      return { content: [{ type: 'text', text: stdout |

| stderr }] };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: error.message }] };
    }
  }
}
