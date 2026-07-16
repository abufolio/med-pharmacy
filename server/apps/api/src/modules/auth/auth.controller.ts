import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard, Roles } from './guards/roles.guard';
import { Public } from './guards/public.decorator';
import { CurrentUser, AuthenticatedUser } from './guards/current-user.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    // Extract refresh token from body or header
    const refreshToken = req.body?.refreshToken;
    if (refreshToken) {
      await this.auth.logout(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PHARMACY_ADMIN', 'SUPER_ADMIN')
  @Post('register-employee')
  @HttpCode(HttpStatus.CREATED)
  async registerEmployee(
    @Body() dto: RegisterEmployeeDto,
    @Req() req: any,
  ) {
    // PHARMACY_ADMIN can only register in their own pharmacy
    const pharmacyId =
      req.user.role === 'SUPER_ADMIN'
        ? dto.pharmacyId!
        : req.user.pharmacyId;

    return this.auth.registerEmployee(dto, pharmacyId);
  }
}
