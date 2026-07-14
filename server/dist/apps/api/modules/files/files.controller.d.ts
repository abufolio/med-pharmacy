import { FilesService } from './files.service';
export declare class FilesController {
    private readonly files;
    constructor(files: FilesService);
    upload(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        filename: string;
        size: number;
        mimeType: string;
    }>;
    uploadMultiple(files: Express.Multer.File[], folder?: string): Promise<{
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
}
