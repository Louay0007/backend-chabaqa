
import { Controller, Get, Patch, Param, Body, UseGuards, Req, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationDto } from '../dto-notification/notification.dto';
import { UpdateNotificationPreferencesDto } from '../dto-notification/update-notification-preferences.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  getUserNotifications(@Req() req) {
    return this.notificationService.getUserNotifications(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, type: NotificationDto })
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200 })
  getUserPreferences(@Req() req) {
    return this.notificationService.getUserPreferences(req.user.userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200 })
  updateUserPreferences(@Req() req, @Body() dto: UpdateNotificationPreferencesDto) {
    return this.notificationService.updateUserPreferences(req.user.userId, dto);
  }
}
