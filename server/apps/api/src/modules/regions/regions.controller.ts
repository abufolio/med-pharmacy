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
import { RegionsService } from './regions.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/regions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regions')
export class RegionsController {
  constructor(private readonly regions: RegionsService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRegionDto) {
    return { success: true, data: await this.regions.create(dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    const result = await this.regions.findAll(Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.regions.findById(id) };
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return { success: true, data: await this.regions.update(id, dto) };
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return { success: true, data: await this.regions.remove(id) };
  }
}
