import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('daily')
  async getDailyStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN'
      ? query.pharmacyId
      : user.pharmacyId;
    if (!pharmacyId) return { data: [], total: 0, page: 1, limit: 31 };
    return this.reports.getDailyStats(
      pharmacyId!,
      query.from,
      query.to,
      Number(query.page || '1'),
      Number(query.limit || '31'),
    );
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('summary')
  async getPharmacySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN'
      ? query.pharmacyId
      : user.pharmacyId;
    if (!pharmacyId) return { message: 'Pharmacy ID is required' };
    return this.reports.getPharmacySummary(pharmacyId!, query.from, query.to);
  }

  @Roles('SUPER_ADMIN')
  @Get('overview')
  async getAdminOverview(@Query() query: ReportsQueryDto) {
    return this.reports.getAdminOverview(query.from, query.to);
  }

  @Roles('SUPER_ADMIN')
  @Get('top-pharmacies')
  async getTopPharmacies(
    @Query('limit') limit = '10',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.getTopPharmacies(Number(limit), from, to);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get('transactions')
  async getTransactionReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN'
      ? query.pharmacyId
      : user.pharmacyId;
    return this.reports.getTransactionReport(
      pharmacyId,
      query.from,
      query.to,
      Number(query.page || '1'),
      Number(query.limit || '100'),
    );
  }
}
