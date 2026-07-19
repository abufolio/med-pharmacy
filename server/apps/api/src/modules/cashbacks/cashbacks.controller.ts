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
import { CashbacksService } from './cashbacks.service';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cashbacks')
export class CashbacksController {
  constructor(private readonly cashbacks: CashbacksService) {}

  // ── Rules ──────────────────────────────────

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async createRule(
    @Body() dto: CreateCashbackRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN'
      ? (dto as any).pharmacyId
      : user.pharmacyId!;
    return { success: true, data: await this.cashbacks.createRule(dto, pharmacyId) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('rules')
  async findAllRules(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN' ? undefined : user.pharmacyId;
    const result = await this.cashbacks.findAllRules(pharmacyId, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('rules/:id')
  async findRuleById(@Param('id') id: string) {
    return { success: true, data: await this.cashbacks.findRuleById(id) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateCashbackRuleDto) {
    return { success: true, data: await this.cashbacks.updateRule(id, dto) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  async removeRule(@Param('id') id: string) {
    return { success: true, data: await this.cashbacks.removeRule(id) };
  }

  // ── User Cashbacks ─────────────────────────

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('user/:userId')
  async findUserCashbacks(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const result = await this.cashbacks.findUserCashbacks(userId, Number(page), Number(limit));
    return { success: true, ...result };
  }
}
