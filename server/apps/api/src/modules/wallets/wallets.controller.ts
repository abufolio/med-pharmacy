import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { RequestWithdrawDto, ReviewWithdrawDto } from './dto/withdraw.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  // ── Wallet Balance ──

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('withdraw-requests')
  async getWithdrawRequests(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.wallets.getWithdrawRequests(undefined, Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get(':userId')
  async getBalance(@Param('userId') userId: string) {
    return this.wallets.getBalance(userId);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get(':userId/transactions')
  async getTransactions(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.wallets.getTransactionHistory(userId, Number(page), Number(limit));
  }

  // ── Withdraw Requests ──

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post(':userId/withdraw')
  @HttpCode(HttpStatus.CREATED)
  async requestWithdraw(
    @Param('userId') userId: string,
    @Body() dto: RequestWithdrawDto,
  ) {
    return this.wallets.requestWithdraw(userId, dto);
  }

  @Roles('SUPER_ADMIN')
  @Post('withdraw-requests/:id/review')
  @HttpCode(HttpStatus.OK)
  async reviewWithdraw(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewWithdrawDto,
  ) {
    return this.wallets.reviewWithdraw(id, user.id, dto);
  }
}
