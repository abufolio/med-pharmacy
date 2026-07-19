import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    const pharmacyId = user.role === 'SUPER_ADMIN' ? dto.pharmacyId! : user.pharmacyId!;
    return { success: true, data: await this.employees.create(dto, pharmacyId) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('page') page = '1', @Query('limit') limit = '50') {
    const result = await this.employees.findAll(user.pharmacyId!, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.employees.findById(id) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return { success: true, data: await this.employees.update(id, dto) };
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string) {
    return { success: true, data: await this.employees.toggleStatus(id, 'SUSPENDED') };
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string) {
    return { success: true, data: await this.employees.toggleStatus(id, 'ACTIVE') };
  }
}
