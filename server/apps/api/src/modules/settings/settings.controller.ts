import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSettingDto) {
    return { success: true, data: await this.settings.create(dto) };
  }

  @Roles('SUPER_ADMIN')
  @Get()
  async findAll(
    @Query('scope') scope?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const result = await this.settings.findAll(scope, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN')
  @Get(':key')
  async findByKey(@Param('key') key: string) {
    return { success: true, data: await this.settings.findByKey(key) };
  }

  @Roles('SUPER_ADMIN')
  @Patch(':key')
  async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return { success: true, data: await this.settings.update(key, dto) };
  }

  @Roles('SUPER_ADMIN')
  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('key') key: string) {
    return { success: true, data: await this.settings.remove(key) };
  }
}
