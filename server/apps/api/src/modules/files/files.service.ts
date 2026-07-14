import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;

  // Allowed MIME types
  private readonly allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/csv',
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10 MB

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    subfolder = 'general',
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File exceeds maximum size of ${this.maxFileSize / 1024 / 1024} MB`);
    }

    // Validate MIME type
    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    const targetDir = path.join(this.uploadDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.bin';
    const filename = `${nanoid()}${ext}`;
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    const url = `/uploads/${subfolder}/${filename}`;

    this.logger.log(`File uploaded: ${url} (${file.size} bytes)`);

    return {
      url,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    subfolder = 'general',
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }[]> {
    return Promise.all(files.map((file) => this.upload(file, subfolder)));
  }

  async getFileInfo(filepath: string): Promise<{ filename: string; size: number; mimeType: string; url: string }> {
    const fullPath = path.join(this.uploadDir, filepath);

    // Prevent directory traversal
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      await fs.promises.access(fullPath);
    } catch {
      throw new NotFoundException('File not found');
    }

    const stat = await fs.promises.stat(fullPath);
    const filename = path.basename(fullPath);

    return {
      filename,
      size: stat.size,
      mimeType: this.guessMimeType(filename),
      url: `/uploads/${filepath}`,
    };
  }

  async delete(filepath: string): Promise<{ message: string }> {
    const fullPath = path.join(this.uploadDir, filepath);

    // Prevent directory traversal
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      await fs.promises.unlink(fullPath);
    } catch {
      throw new NotFoundException('File not found');
    }

    this.logger.log(`File deleted: ${filepath}`);

    return { message: 'File deleted' };
  }

  private guessMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}
