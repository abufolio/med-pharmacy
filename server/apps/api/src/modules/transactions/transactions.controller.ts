import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // If PHARMACY_ADMIN or EMPLOYEE, set pharmacyId from auth context
    if (user.scope === 'PHARMACY') {
      dto.pharmacyId = user.pharmacyId!;
      dto.employeeId = dto.employeeId || user.id;
    }
    const result = await this.transactions.create(dto);
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN' ? undefined : user.pharmacyId;
    const result = await this.transactions.findAll(pharmacyId, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.transactions.findById(id);
    return { success: true, data: result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(@Param('id') id: string) {
    return this.transactions.reverseTransaction(id);
  }
}
