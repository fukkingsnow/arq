import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class ArqMcpTools {
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
      return { 
        content: [{ type: 'text', text: stdout |

| stderr }] 
      };
    } catch (error) {
      return { 
        isError: true, 
        content: [{ type: 'text', text: `Ошибка выполнения: ${error.message}` }] 
      };
    }
  }

  @Tool({
    name: 'read_file_content',
    description: 'Читает содержимое файла для аудита кода',
    parameters: z.object({
      path: z.string(),
    }),
  })
  async readFile({ path }: { path: string }) {
    try {
      const { stdout } = await execAsync(`cat ${path}`);
      return { content: [{ type: 'text', text: stdout }] };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: error.message }] };
    }
  }
}
