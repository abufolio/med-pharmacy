export declare class FilesService {
    private readonly logger;
    private readonly uploadDir;
    private readonly allowedMimes;
    private readonly maxFileSize;
    constructor();
    private ensureUploadDir;
    upload(file: Express.Multer.File, subfolder?: string): Promise<{
        url: string;
        filename: string;
        size: number;
        mimeType: string;
    }>;
    uploadMultiple(files: Express.Multer.File[], subfolder?: string): Promise<{
        url: string;
        filename: string;
        size: number;
        mimeType: string;
    }[]>;
    getFileInfo(filepath: string): Promise<{
        filename: string;
        size: number;
        mimeType: string;
        url: string;
    }>;
    delete(filepath: string): Promise<{
        message: string;
    }>;
    private guessMimeType;
}
