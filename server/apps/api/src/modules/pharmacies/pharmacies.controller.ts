import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import {
  CreatePharmacyDto, UpdatePharmacyDto,
  UpdatePharmacyStatusDto, ChangePharmacyPasswordDto,
} from './dto/create-pharmacy.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PharmaciesController {
  constructor(private readonly pharmacies: PharmaciesService) {}

  // ── Pharmacies ──
  @Roles('SUPER_ADMIN')
  @Post('pharmacies')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePharmacyDto) {
    return { success: true, data: await this.pharmacies.create(dto) };
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
      const result = await this.pharmacies.findById(user.pharmacyId!);
      return { success: true, data: result };
    }
    const result = await this.pharmacies.findAll(status, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('pharmacies/:id')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.pharmacies.findById(id) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch('pharmacies/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePharmacyDto) {
    return { success: true, data: await this.pharmacies.update(id, dto) };
  }

  @Roles('SUPER_ADMIN')
  @Patch('pharmacies/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePharmacyStatusDto,
  ) {
    return { success: true, data: await this.pharmacies.updateStatus(id, dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('pharmacies/:id/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePharmacyPasswordDto,
  ) {
    return { success: true, data: await this.pharmacies.changePassword(id, dto) };
  }

  // ── Cashback Rules ──
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('pharmacies/:id/cashback-rules')
  @HttpCode(HttpStatus.CREATED)
  async createCashbackRule(
    @Param('id') pharmacyId: string,
    @Body() dto: CreateCashbackRuleDto,
  ) {
    return { success: true, data: await this.pharmacies.createCashbackRule(pharmacyId, dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('pharmacies/:id/cashback-rules')
  async getCashbackRules(@Param('id') pharmacyId: string) {
    return { success: true, data: await this.pharmacies.getCashbackRules(pharmacyId) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch('cashback-rules/:ruleId')
  async updateCashbackRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateCashbackRuleDto,
  ) {
    return { success: true, data: await this.pharmacies.updateCashbackRule(ruleId, dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Delete('cashback-rules/:ruleId')
  async deleteCashbackRule(@Param('ruleId') ruleId: string) {
    return { success: true, data: await this.pharmacies.deleteCashbackRule(ruleId) };
  }
}
