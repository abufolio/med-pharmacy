import { Controller, Get, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/guards/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN')
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('page') page = '1', @Query('limit') limit = '50') {
    const result = await this.notifications.findByUser(user.id, Number(page), Number(limit));
    return { success: true, ...result };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string) {
    return { success: true, data: await this.notifications.markRead(id) };
  }

  @Roles('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE')
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.notifications.markAllRead(user.id) };
  }
}
