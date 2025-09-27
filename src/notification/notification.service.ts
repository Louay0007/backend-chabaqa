
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationChannel } from '../schema/notification.schema';
import { NotificationPreferences } from '../schema/notification-preferences.schema';
import { NotificationTemplate } from '../schema/notification-template.schema';
import { User } from '../schema/user.schema';
import { CreateNotificationDto } from '../dto-notification/create-notification.dto';
import { UpdateNotificationPreferencesDto } from '../dto-notification/update-notification-preferences.dto';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(NotificationPreferences.name) private preferencesModel: Model<NotificationPreferences>,
    @InjectModel(NotificationTemplate.name) private templateModel: Model<NotificationTemplate>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationGateway: NotificationGateway,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    const user = await this.userModel.findById(dto.recipient).exec();
    if (!user) {
      this.logger.warn(`User not found: ${dto.recipient}`);
      return;
    }

    const preferences = await this.getUserPreferences(user._id.toString());

    // In-App Notification
    if (preferences.preferences.get(dto.type)?.inApp) {
      const inAppNotification = new this.notificationModel({
        ...dto,
        channel: NotificationChannel.IN_APP,
      });
      await inAppNotification.save();
      this.notificationGateway.sendNotificationToUser(user._id.toString(), inAppNotification);
    }

    // Email Notification
    if (preferences.preferences.get(dto.type)?.email) {
      if (!this.isInQuietHours(preferences)) {
        await this.emailService.sendGenericEmail({
          to: user.email,
          subject: dto.title,
          text: dto.body,
        });
      }
    }

    // TODO: Implement Push and SMS notifications
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ recipient: userId }).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    ).exec();
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.preferencesModel.findOne({ user: userId }).exec();
    if (!preferences) {
      preferences = new this.preferencesModel({ user: userId });
      await preferences.save();
    }
    return preferences;
  }

  async updateUserPreferences(userId: string, dto: UpdateNotificationPreferencesDto): Promise<NotificationPreferences> {
    const preferences = await this.getUserPreferences(userId);
    if (dto.preferences) {
      dto.preferences.forEach((value, key) => {
        preferences.preferences.set(key, {
          inApp: value.inApp ?? true,
          email: value.email ?? true,
          push: value.push ?? false,
          sms: value.sms ?? false,
        });
      });
    }
    if (dto.quietHours) {
      preferences.quietHours = { ...preferences.quietHours, ...dto.quietHours };
    }
    return preferences.save();
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.isEnabled) {
      return false;
    }
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;
    const { start, end } = preferences.quietHours;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else { // overnight
      return currentTime >= start || currentTime <= end;
    }
  }

  // TODO: Add template rendering logic
}
