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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.users.findAll(search, Number(page), Number(limit));
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    return this.users.findByPhone(phone);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  async block(@Param('id') id: string) {
    return this.users.block(id);
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  async unblock(@Param('id') id: string) {
    return this.users.unblock(id);
  }
}
