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
import { DistrictsService } from './districts.service';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/districts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districts: DistrictsService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDistrictDto) {
    return { success: true, data: await this.districts.create(dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get()
  async findAll(
    @Query('regionId') regionId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    const result = await this.districts.findAll(regionId, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.districts.findById(id) };
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDistrictDto) {
    return { success: true, data: await this.districts.update(id, dto) };
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return { success: true, data: await this.districts.remove(id) };
  }
}
