import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import {
  CreatePharmacyDto, UpdatePharmacyDto,
  UpdatePharmacyStatusDto, ChangePharmacyPasswordDto,
} from './dto/create-pharmacy.dto';
import {
  CreateRegionDto, CreateDistrictDto,
  UpdateRegionDto, UpdateDistrictDto,
} from './dto/region.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';
import { Public } from '../auth/guards/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PharmaciesController {
  constructor(private readonly pharmacies: PharmaciesService) {}

  // ── Regions ──
  @Roles('SUPER_ADMIN')
  @Post('regions')
  @HttpCode(HttpStatus.CREATED)
  async createRegion(@Body() dto: CreateRegionDto) {
    return this.pharmacies.createRegion(dto);
  }

  @Public()
  @Get('regions')
  async getRegions() {
    return this.pharmacies.getRegions();
  }

  @Roles('SUPER_ADMIN')
  @Patch('regions/:id')
  async updateRegion(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.pharmacies.updateRegion(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Delete('regions/:id')
  async deleteRegion(@Param('id') id: string) {
    return this.pharmacies.deleteRegion(id);
  }

  // ── Districts ──
  @Roles('SUPER_ADMIN')
  @Post('districts')
  @HttpCode(HttpStatus.CREATED)
  async createDistrict(@Body() dto: CreateDistrictDto) {
    return this.pharmacies.createDistrict(dto);
  }

  @Public()
  @Get('districts')
  async getDistricts(@Query('regionId') regionId?: string) {
    return this.pharmacies.getDistricts(regionId);
  }

  @Roles('SUPER_ADMIN')
  @Patch('districts/:id')
  async updateDistrict(@Param('id') id: string, @Body() dto: UpdateDistrictDto) {
    return this.pharmacies.updateDistrict(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Delete('districts/:id')
  async deleteDistrict(@Param('id') id: string) {
    return this.pharmacies.deleteDistrict(id);
  }

  // ── Pharmacies ──
  @Roles('SUPER_ADMIN')
  @Post('pharmacies')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePharmacyDto) {
    return this.pharmacies.create(dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('pharmacies')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    // Pharmacy admin can only see their own pharmacy
    if (user.scope === 'PHARMACY') {
      return this.pharmacies.findById(user.pharmacyId!);
    }
    return this.pharmacies.findAll(status, Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('pharmacies/:id')
  async findById(@Param('id') id: string) {
    return this.pharmacies.findById(id);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch('pharmacies/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePharmacyDto) {
    return this.pharmacies.update(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Patch('pharmacies/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePharmacyStatusDto,
  ) {
    return this.pharmacies.updateStatus(id, dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('pharmacies/:id/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePharmacyPasswordDto,
  ) {
    return this.pharmacies.changePassword(id, dto);
  }

  // ── Cashback Rules ──
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('pharmacies/:id/cashback-rules')
  @HttpCode(HttpStatus.CREATED)
  async createCashbackRule(
    @Param('id') pharmacyId: string,
    @Body() dto: CreateCashbackRuleDto,
  ) {
    return this.pharmacies.createCashbackRule(pharmacyId, dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('pharmacies/:id/cashback-rules')
  async getCashbackRules(@Param('id') pharmacyId: string) {
    return this.pharmacies.getCashbackRules(pharmacyId);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch('cashback-rules/:ruleId')
  async updateCashbackRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateCashbackRuleDto,
  ) {
    return this.pharmacies.updateCashbackRule(ruleId, dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Delete('cashback-rules/:ruleId')
  async deleteCashbackRule(@Param('ruleId') ruleId: string) {
    return this.pharmacies.deleteCashbackRule(ruleId);
  }
}
