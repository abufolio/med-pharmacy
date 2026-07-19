import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

import * as fs from 'fs';
import * as path from 'path';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // By default, mock existsSync to return true so constructor doesn't try mkdirSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // Constructor / upload directory
  // ──────────────────────────────────────────────

  describe('constructor', () => {
    it('should create uploads directory if it does not exist', async () => {
      jest.clearAllMocks();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mod = await Test.createTestingModule({
        providers: [FilesService],
      }).compile();
      const svc = mod.get<FilesService>(FilesService);
      expect(svc).toBeDefined();
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );
    });

    it('should not create uploads directory if it already exists', async () => {
      jest.clearAllMocks();
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mod = await Test.createTestingModule({
        providers: [FilesService],
      }).compile();
      const svc = mod.get<FilesService>(FilesService);
      expect(svc).toBeDefined();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // upload
  // ──────────────────────────────────────────────

  describe('upload', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 500, // 500 KB
      buffer: Buffer.from('fake-image-buffer'),
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('should upload a valid file and return file info', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.upload(mockFile, 'avatars');

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('avatars'));
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('mocked-id.jpg'),
        mockFile.buffer,
      );
      expect(result).toEqual({
        url: '/uploads/avatars/mocked-id.jpg',
        filename: 'mocked-id.jpg',
        size: 1024 * 500,
        mimeType: 'image/jpeg',
      });
    });

    it('should use "general" subfolder when none provided', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.upload(mockFile);

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('general'),
        mockFile.buffer,
      );
    });

    it('should create subfolder directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await service.upload(mockFile, 'logos');

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('logos'),
        { recursive: true },
      );
    });

    it('should throw BadRequestException when file exceeds max size (10MB)', async () => {
      const oversizedFile: Express.Multer.File = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11 MB
      };

      await expect(service.upload(oversizedFile)).rejects.toThrow(BadRequestException);
      await expect(service.upload(oversizedFile)).rejects.toThrow(
        /exceeds maximum size/i,
      );
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported MIME types', async () => {
      const invalidFile: Express.Multer.File = {
        ...mockFile,
        mimetype: 'image/svg+xml',
      };

      await expect(service.upload(invalidFile)).rejects.toThrow(BadRequestException);
      await expect(service.upload(invalidFile)).rejects.toThrow(
        /file type image\/svg\+xml is not allowed/i,
      );
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should accept all allowed MIME types', async () => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/csv',
      ];

      for (const mime of allowedMimes) {
        const file: Express.Multer.File = { ...mockFile, mimetype: mime, originalname: `file${mime === 'application/pdf' ? '.pdf' : mime === 'text/csv' ? '.csv' : '.ext'}` };
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

        const result = await service.upload(file, 'general');
        expect(result.mimeType).toBe(mime);
      }
    });

    it('should handle file with no extension (use .bin)', async () => {
      const fileNoExt: Express.Multer.File = {
        ...mockFile,
        originalname: 'noext',
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.upload(fileNoExt, 'general');

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('mocked-id.bin'),
        fileNoExt.buffer,
      );
    });

    it('should handle file write failure', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

      await expect(service.upload(mockFile)).rejects.toThrow('Disk full');
    });
  });

  // ──────────────────────────────────────────────
  // uploadMultiple
  // ──────────────────────────────────────────────

  describe('uploadMultiple', () => {
    it('should upload multiple files and return array of file info', async () => {
      const files: Express.Multer.File[] = [
        {
          originalname: 'img1.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          buffer: Buffer.from('data1'),
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
        {
          originalname: 'img2.png',
          mimetype: 'image/png',
          size: 2000,
          buffer: Buffer.from('data2'),
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const results = await service.uploadMultiple(files, 'gallery');

      expect(results).toHaveLength(2);
      expect(results[0].filename).toBe('mocked-id.jpg');
      expect(results[1].filename).toBe('mocked-id.png');
      expect(results[0].url).toBe('/uploads/gallery/mocked-id.jpg');
      expect(results[1].url).toBe('/uploads/gallery/mocked-id.png');
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should use default subfolder when none provided', async () => {
      const files: Express.Multer.File[] = [
        {
          originalname: 'img.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          buffer: Buffer.from('data'),
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const results = await service.uploadMultiple(files);
      expect(results[0].url).toContain('/general/');
    });

    it('should propagate upload errors for individual files', async () => {
      const files: Express.Multer.File[] = [
        {
          originalname: 'good.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          buffer: Buffer.from('good'),
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
        {
          originalname: 'bad.svg',
          mimetype: 'image/svg+xml',
          size: 1000,
          buffer: Buffer.from('bad'),
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await expect(service.uploadMultiple(files)).rejects.toThrow(BadRequestException);
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(1); // only the first one wrote
    });

    it('should return empty array for empty file list', async () => {
      const results = await service.uploadMultiple([]);
      expect(results).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────
  // getFileInfo
  // ──────────────────────────────────────────────

  describe('getFileInfo', () => {
    it('should return file info for an existing file', async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.stat as jest.Mock).mockResolvedValue({
        size: 12345,
        isFile: () => true,
      });

      const result = await service.getFileInfo('avatars/mocked-id.jpg');

      expect(fs.promises.access).toHaveBeenCalledWith(
        expect.stringContaining('mocked-id.jpg'),
      );
      expect(fs.promises.stat).toHaveBeenCalledWith(
        expect.stringContaining('mocked-id.jpg'),
      );
      expect(result).toEqual({
        filename: 'mocked-id.jpg',
        size: 12345,
        mimeType: 'image/jpeg',
        url: '/uploads/avatars/mocked-id.jpg',
      });
    });

    it('should throw BadRequestException on directory traversal attempt', async () => {
      await expect(service.getFileInfo('../../etc/passwd')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getFileInfo('../../etc/passwd')).rejects.toThrow(
        /invalid file path/i,
      );
      expect(fs.promises.access).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when file does not exist', async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(service.getFileInfo('avatars/missing.jpg')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getFileInfo('avatars/missing.jpg')).rejects.toThrow(
        /file not found/i,
      );
    });

    it('should guess MIME types correctly based on extension', async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 100, isFile: () => true });

      const testCases = [
        { filepath: 'doc.pdf', expectedMime: 'application/pdf' },
        { filepath: 'data.csv', expectedMime: 'text/csv' },
        { filepath: 'image.png', expectedMime: 'image/png' },
        { filepath: 'image.webp', expectedMime: 'image/webp' },
        { filepath: 'anim.gif', expectedMime: 'image/gif' },
        { filepath: 'photo.jpeg', expectedMime: 'image/jpeg' },
        { filepath: 'photo.jpg', expectedMime: 'image/jpeg' },
        { filepath: 'unknown.bin', expectedMime: 'application/octet-stream' },
        { filepath: 'noext', expectedMime: 'application/octet-stream' },
      ];

      for (const { filepath, expectedMime } of testCases) {
        const result = await service.getFileInfo(filepath);
        expect(result.mimeType).toBe(expectedMime);
      }
    });
  });

  // ──────────────────────────────────────────────
  // delete
  // ──────────────────────────────────────────────

  describe('delete', () => {
    it('should delete an existing file and return success message', async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await service.delete('avatars/mocked-id.jpg');

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        expect.stringContaining('mocked-id.jpg'),
      );
      expect(result).toEqual({ message: 'File deleted' });
    });

    it('should throw BadRequestException on directory traversal attempt', async () => {
      await expect(service.delete('../../../windows/system32/config')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete('../../../windows/system32/config')).rejects.toThrow(
        /invalid file path/i,
      );
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when file does not exist', async () => {
      (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(service.delete('avatars/ghost.png')).rejects.toThrow(NotFoundException);
      await expect(service.delete('avatars/ghost.png')).rejects.toThrow(/file not found/i);
    });
  });
});
