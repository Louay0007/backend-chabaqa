import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../schema/conversation.schema';
import { Message, MessageDocument } from '../schema/message.schema';
import { Community, CommunityDocument } from '../schema/community.schema';
import { User } from '../schema/user.schema';
import { PolicyService } from '../common/services/policy.service';
import { DmGateway } from './dm.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DmService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel('User') private userModel: Model<User>,

    private readonly policyService: PolicyService,
    private readonly dmGateway: DmGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async startCommunityConversation(userId: string, communityId: string): Promise<ConversationDocument> {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Communauté introuvable');

    const isMember = community.isMember(new Types.ObjectId(userId));
    if (!isMember) throw new ForbiddenException('Vous devez être membre de cette communauté');

    const creatorId = community.createur;
    const existing = await this.conversationModel.findOne({
      type: 'COMMUNITY_DM',
      participantA: new Types.ObjectId(userId),
      participantB: creatorId,
      communityId: community._id,
    });
    if (existing) return existing;

    const conv = await this.conversationModel.create({
      type: 'COMMUNITY_DM',
      participantA: new Types.ObjectId(userId),
      participantB: creatorId,
      communityId: community._id,
      isOpen: true,
      unreadCountA: 0,
      unreadCountB: 0,
    });
    return conv;
  }

  async startHelpConversation(userId: string): Promise<ConversationDocument> {
    const existing = await this.conversationModel.findOne({
      type: 'HELP_DM',
      participantA: new Types.ObjectId(userId),
      isOpen: true,
    });
    if (existing) return existing;

    return this.conversationModel.create({
      type: 'HELP_DM',
      participantA: new Types.ObjectId(userId),
      isOpen: true,
      unreadCountA: 0,
      unreadCountB: 0,
    });
  }

  async listUnassignedHelpThreads() {
    const items = await this.conversationModel
      .find({ type: 'HELP_DM', $or: [{ participantB: { $exists: false } }, { participantB: null }] })
      .sort({ createdAt: 1 });
    return { items };
  }

  async listInbox(userId: string, type?: 'community' | 'help', page = 1, limit = 20) {
    const filter: any = { $or: [{ participantA: new Types.ObjectId(userId) }, { participantB: new Types.ObjectId(userId) }] };
    if (type === 'community') filter.type = 'COMMUNITY_DM';
    if (type === 'help') filter.type = 'HELP_DM';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit),
      this.conversationModel.countDocuments(filter),
    ]);
    return { items, page, total };
  }

  async listMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation introuvable');
    const uid = new Types.ObjectId(userId);
    if (!uid.equals(conv.participantA) && (!conv.participantB || !uid.equals(conv.participantB))) {
      throw new ForbiddenException();
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.messageModel.countDocuments({ conversationId: conv._id }),
    ]);
    return { items: items.reverse(), page, total };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    payload: { text?: string; attachments?: { url: string; type: 'image' | 'file' | 'video'; size: number }[] },
    options?: { isAdmin?: boolean }
  ) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation introuvable');
    const sid = new Types.ObjectId(senderId);
    const isParticipantA = sid.equals(conv.participantA);
    const isParticipantB = conv.participantB && sid.equals(conv.participantB);
    if (!isParticipantA && !isParticipantB) {
      // Special case: HELP_DM unassigned, allow admin to reply and auto-assign
      if (!(conv.type === 'HELP_DM' && !conv.participantB && options?.isAdmin)) {
        throw new ForbiddenException();
      }
      conv.participantB = sid; // auto-assign to this admin
    }
    if (!payload.text && (!payload.attachments || payload.attachments.length === 0)) {
      throw new BadRequestException('Message vide');
    }

    // Determine recipient
    const recipientId = sid.equals(conv.participantA) ? conv.participantB : conv.participantA;
    if (!recipientId) {
      // For HELP_DM: first admin assignment will be handled elsewhere; allow sending only if both participants exist
      if (conv.type === 'HELP_DM') throw new BadRequestException('Aucun admin n\'est assigné');
    }

    const msg = await this.messageModel.create({
      conversationId: conv._id,
      senderId: sid,
      recipientId: recipientId!,
      text: payload.text,
      attachments: payload.attachments || [],
    });

    // Update conversation summary
    conv.lastMessageText = payload.text || (payload.attachments && payload.attachments.length > 0 ? '[Pièce jointe]' : '');
    conv.lastMessageAt = new Date();
    if (sid.equals(conv.participantA)) {
      conv.unreadCountB = (conv.unreadCountB || 0) + 1;
    } else {
      conv.unreadCountA = (conv.unreadCountA || 0) + 1;
    }
    await conv.save();

    // Emit realtime events
    if (recipientId) {
      this.dmGateway.emitNewMessage(conv._id.toString(), recipientId.toString(), msg);

      // Send notification
      const sender = await this.userModel.findById(senderId);
      if (sender) {
        this.notificationService.createNotification({
          recipient: recipientId.toString(),
          sender: senderId,
          type: 'new_dm_message',
          title: `New message from ${sender.name}`,
          body: msg.text || 'You received a new attachment.',
          data: { conversationId: conv._id.toString() },
        });
      }
    }

    return msg;
  }

  async markRead(conversationId: string, userId: string) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation introuvable');
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    if (uid.equals(conv.participantA)) conv.unreadCountA = 0;
    else if (conv.participantB && uid.equals(conv.participantB)) conv.unreadCountB = 0;
    else throw new ForbiddenException();

    await Promise.all([
      conv.save(),
      this.messageModel.updateMany(
        { conversationId: conv._id, recipientId: uid, readAt: { $exists: false } },
        { $set: { readAt: now } }
      ),
    ]);
    this.dmGateway.emitRead(conv._id.toString(), uid.toString(), now);
    return { ok: true, readAt: now };
  }

  async assignHelpThread(conversationId: string, adminId: string) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.type !== 'HELP_DM') throw new BadRequestException('Non applicable');
    if (conv.participantB) return conv; // already assigned
    conv.participantB = new Types.ObjectId(adminId);
    await conv.save();
    return conv;
  }
}


