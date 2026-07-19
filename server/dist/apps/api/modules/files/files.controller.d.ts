import { FilesService } from './files.service';
export declare class FilesController {
    private readonly files;
    constructor(files: FilesService);
    upload(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        data: {
            url: string;
            filename: string;
            size: number;
            mimeType: string;
        };
    }>;
    uploadMultiple(files: Express.Multer.File[], folder?: string): Promise<{
        success: boolean;
        data: {
            url: string;
            filename: string;
            size: number;
            mimeType: string;
        }[];
    }>;
    getFileInfo(filepath: string): Promise<{
        success: boolean;
        data: {
            filename: string;
            size: number;
            mimeType: string;
            url: string;
        };
    }>;
    delete(filepath: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
