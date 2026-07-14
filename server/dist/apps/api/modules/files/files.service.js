"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nanoid_1 = require("nanoid");
let FilesService = FilesService_1 = class FilesService {
    logger = new common_1.Logger(FilesService_1.name);
    uploadDir;
    allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/csv',
    ];
    maxFileSize = 10 * 1024 * 1024;
    constructor() {
        this.uploadDir = path.resolve(process.cwd(), 'uploads');
        this.ensureUploadDir();
    }
    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async upload(file, subfolder = 'general') {
        if (file.size > this.maxFileSize) {
            throw new common_1.BadRequestException(`File exceeds maximum size of ${this.maxFileSize / 1024 / 1024} MB`);
        }
        if (!this.allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type ${file.mimetype} is not allowed`);
        }
        const targetDir = path.join(this.uploadDir, subfolder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        const ext = path.extname(file.originalname) || '.bin';
        const filename = `${(0, nanoid_1.nanoid)()}${ext}`;
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
    async uploadMultiple(files, subfolder = 'general') {
        return Promise.all(files.map((file) => this.upload(file, subfolder)));
    }
    async getFileInfo(filepath) {
        const fullPath = path.join(this.uploadDir, filepath);
        if (!fullPath.startsWith(this.uploadDir)) {
            throw new common_1.BadRequestException('Invalid file path');
        }
        try {
            await fs.promises.access(fullPath);
        }
        catch {
            throw new common_1.NotFoundException('File not found');
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
    async delete(filepath) {
        const fullPath = path.join(this.uploadDir, filepath);
        if (!fullPath.startsWith(this.uploadDir)) {
            throw new common_1.BadRequestException('Invalid file path');
        }
        try {
            await fs.promises.unlink(fullPath);
        }
        catch {
            throw new common_1.NotFoundException('File not found');
        }
        this.logger.log(`File deleted: ${filepath}`);
        return { message: 'File deleted' };
    }
    guessMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeMap = {
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
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FilesService);
//# sourceMappingURL=files.service.js.map