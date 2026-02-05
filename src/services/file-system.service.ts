import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class FileSystemService {
  private readonly logger = new Logger(FileSystemService.name);
  private readonly rootPath = '/opt/arq/src';

  /**
   * Безопасная замена строки в файле с созданием бэкапа
   */
  async replaceInFile(relativePath: string, target: string | RegExp, replacement: string): Promise<boolean> {
    try {
      const filePath = join(this.rootPath, relativePath);
      if (!existsSync(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        return false;
      }

      const content = readFileSync(filePath, 'utf8');
      
      // Создаем бэкап перед правкой
      copyFileSync(filePath, `${filePath}.bak`);
      
      const newContent = content.replace(target, replacement);
      
      if (content === newContent) {
        this.logger.warn(`No changes made to ${relativePath}. Target not found.`);
        return false;
      }

      writeFileSync(filePath, newContent, 'utf8');
      this.logger.log(`Successfully patched: ${relativePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to patch file ${relativePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Чтение структуры проекта для анализа
   */
  async readFile(relativePath: string): Promise<string | null> {
    const filePath = join(this.rootPath, relativePath);
    return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
  }
}
