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
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { AssignCardDto, UnassignCardDto } from './dto/assign-card.dto';
import { ScanCardDto } from './dto/scan-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Public } from '../auth/guards/public.decorator';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  /* ── Card Management ── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post()
  async create(@Body() dto: CreateCardDto) {
    return { success: true, data: await this.cards.create(dto) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    const result = await this.cards.findAll(Number(page), Number(limit));
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get(':uid')
  async findByUid(@Param('uid') uid: string) {
    return { success: true, data: await this.cards.findByUid(uid) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch(':uid/status')
  async updateStatus(
    @Param('uid') uid: string,
    @Body('status') status: 'BLOCKED' | 'ACTIVE',
  ) {
    return { success: true, data: await this.cards.updateStatus(uid, status) };
  }

  /* ── Assignment ── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  async assignCard(@Body() dto: AssignCardDto) {
    return { success: true, data: await this.cards.assignCard(dto) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post('unassign')
  @HttpCode(HttpStatus.OK)
  async unassignCard(@Body() dto: UnassignCardDto) {
    return { success: true, data: await this.cards.unassignCard(dto) };
  }

  /* ── NFC Scan — Public (authenticated via reader) ── */

  @Public()
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scan(@Body() dto: ScanCardDto) {
    return this.cards.scan(dto);
  }
}
