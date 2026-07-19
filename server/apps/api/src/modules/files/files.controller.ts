import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return { success: true, data: await this.files.upload(file, folder || 'general') };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.CREATED)
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    return { success: true, data: await this.files.uploadMultiple(files, folder || 'general') };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('info')
  async getFileInfo(@Query('path') filepath: string) {
    if (!filepath) throw new BadRequestException('File path is required');
    return { success: true, data: await this.files.getFileInfo(filepath) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Delete()
  @HttpCode(HttpStatus.OK)
  async delete(@Query('path') filepath: string) {
    if (!filepath) throw new BadRequestException('File path is required');
    return { success: true, data: await this.files.delete(filepath) };
  }
}
