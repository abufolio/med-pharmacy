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
import { ReadersService } from './readers.service';
import { CreateReaderDto, PingReaderDto } from './dto/create-reader.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Public } from '../auth/guards/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@Controller('readers')
export class ReadersController {
  constructor(private readonly readers: ReadersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post()
  async create(
    @Body() dto: CreateReaderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN' ? dto.pharmacyId! : user.pharmacyId!;
    return this.readers.create(dto, pharmacyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pharmacyId = user.role === 'SUPER_ADMIN' ? undefined : user.pharmacyId;
    return this.readers.findAll(pharmacyId, Number(page), Number(limit));
  }

  @Public()
  @Post('ping')
  @HttpCode(HttpStatus.OK)
  async ping(@Body() dto: PingReaderDto) {
    return this.readers.ping(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch(':serialNumber/status')
  async updateStatus(
    @Param('serialNumber') serialNumber: string,
    @Body('status') status: 'ONLINE' | 'OFFLINE' | 'FAULTY',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.readers.updateStatus(serialNumber, status, user.pharmacyId, user.scope);
  }
}
