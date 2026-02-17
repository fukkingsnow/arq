import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
// Type definition for file uploads (compatible with Express/Multer)
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

interface UploadConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

// Configuration interface for file uploads
interface UploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
  hash: string;
  uploadedAt: Date;
}

@Injectable()
export class FileUploadService {
  private defaultConfig: UploadConfig = {
    uploadDir: './uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt']
  };

  constructor() {
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.defaultConfig.uploadDir)) {
      fs.mkdirSync(this.defaultConfig.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: MulterFile, config?: Partial<UploadConfig>): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > finalConfig.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${finalConfig.maxFileSize / (1024 * 1024)}MB`
      );
    }

    if (!finalConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!finalConfig.allowedExtensions.includes(ext)) {
      throw new BadRequestException(`File extension ${ext} not allowed`);
    }

    return true;
  }

  /**
   * Upload single file
   */
  async uploadFile(
    file: MulterFile,
    config?: Partial<UploadConfig>
  ): Promise<UploadResult> {
    this.validateFile(file, config);
    const finalConfig = { ...this.defaultConfig, ...config };

    const hash = this.generateFileHash(file.buffer);
    const extension = path.extname(file.originalname);
    const filename = `${Date.now()}-${hash}${extension}`;
    const filepath = path.join(finalConfig.uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return {
      filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: filepath,
      url: `/uploads/${filename}`,
      hash,
      uploadedAt: new Date()
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: MulterFile[],
    config?: Partial<UploadConfig>
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map(file => this.uploadFile(file, config))
    );
  }

  /**
   * Delete file
   */
  deleteFile(filename: string): boolean {
    const filepath = path.join(this.defaultConfig.uploadDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Get file info
   */
  getFileInfo(filename: string): any {
    const filepath = path.join(this.defaultConfig.uploadDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new BadRequestException('File not found');
    }

    const stats = fs.statSync(filepath);
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  /**
   * List all uploaded files
   */
  listFiles(): string[] {
    return fs.readdirSync(this.defaultConfig.uploadDir);
  }

  /**
   * Clear all uploaded files
   */
  clearUploads(): number {
    const files = fs.readdirSync(this.defaultConfig.uploadDir);
    let deleted = 0;

    files.forEach(file => {
      const filepath = path.join(this.defaultConfig.uploadDir, file);
      fs.unlinkSync(filepath);
      deleted++;
    });

    return deleted;
  }

  /**
   * Get upload directory size
   */
  getDirectorySize(): number {
    const files = fs.readdirSync(this.defaultConfig.uploadDir);
    let size = 0;

    files.forEach(file => {
      const filepath = path.join(this.defaultConfig.uploadDir, file);
      const stats = fs.statSync(filepath);
      size += stats.size;
    });

    return size;
  }

  /**
   * Generate file hash (SHA256)
   */
  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 12);
  }
}
