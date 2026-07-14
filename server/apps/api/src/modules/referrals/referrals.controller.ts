import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto, UpdateReferralDto } from './dto/referrals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateReferralDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // For now, referrer is the acting employee/admin — in production this
    // would come from the user's own referral link
    return this.referrals.create(user.id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.referrals.findAll(Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('my')
  async myReferrals(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.referrals.findByReferrer(user.id, Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('my/stats')
  async myStats(@CurrentUser() user: AuthenticatedUser) {
    return this.referrals.getReferralStats(user.id);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('referred/:referredId')
  async findByReferred(@Param('referredId') referredId: string) {
    return this.referrals.findByReferred(referredId);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReferralDto) {
    return this.referrals.update(id, dto);
  }
}
