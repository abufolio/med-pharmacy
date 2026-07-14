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
import { PromocodesService } from './promocodes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, RedeemPromoCodeDto } from './dto/promocodes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodes: PromocodesService) {}

  // ── Management ──────────────────────────────

  @Roles('SUPER_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePromoCodeDto) {
    return this.promocodes.create(dto);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.promocodes.findAll(Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN')
  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.promocodes.findByCode(code);
  }

  @Roles('SUPER_ADMIN')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.promocodes.findById(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promocodes.update(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.promocodes.remove(id);
  }

  // ── Redemption ──────────────────────────────

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  async redeem(
    @Body() dto: RedeemPromoCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.promocodes.redeem(user.id, dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('redemptions/:userId')
  async getUserRedemptions(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.promocodes.getUserRedemptions(userId, Number(page), Number(limit));
  }
}
