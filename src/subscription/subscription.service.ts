import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../schema/subscription.schema';
import { Plan, PlanDocument, PlanTier } from '../schema/plan.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
  ) {}

  async startTrialForCreator(creatorId: string | Types.ObjectId) {
    const existing = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (existing && (existing.status === SubscriptionStatus.ACTIVE || existing.status === SubscriptionStatus.TRIALING)) {
      throw new BadRequestException('Une souscription active existe déjà');
    }

    const plan = await this.planModel.findOne({ tier: PlanTier.STARTER, isActive: true });
    if (!plan) {
      throw new BadRequestException('Plan STARTER introuvable');
    }

    const now = new Date();
    const trialEnds = new Date(now.getTime() + (plan.trialDays || 7) * 24 * 60 * 60 * 1000);

    const sub = await this.subModel.findOneAndUpdate(
      { creatorId: new Types.ObjectId(creatorId as any) },
      {
        $set: {
          plan: plan.tier,
          status: SubscriptionStatus.TRIALING,
          trialEndsAt: trialEnds,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnds,
          cancelAtPeriodEnd: false,
          communitiesMax: plan.limits.communitiesMax,
          membersMax: plan.limits.membersMax,
          coursesActivationMax: plan.limits.coursesActivationMax,
          storageGB: plan.limits.storageGB,
          adminsMax: plan.limits.adminsMax,
        },
      },
      { upsert: true, new: true },
    );

    return {
      message: 'Essai gratuit démarré',
      subscription: sub,
    };
  }

  async upgradePlan(creatorId: string | Types.ObjectId, tier: PlanTier) {
    const plan = await this.planModel.findOne({ tier, isActive: true });
    if (!plan) {
      throw new BadRequestException('Plan introuvable ou inactif');
    }

    const now = new Date();
    // For simplicity, set current period to 30 days from now (until provider integration)
    const next = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sub = await this.subModel.findOneAndUpdate(
      { creatorId: new Types.ObjectId(creatorId as any) },
      {
        $set: {
          plan: plan.tier,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: next,
          cancelAtPeriodEnd: false,
          communitiesMax: plan.limits.communitiesMax,
          membersMax: plan.limits.membersMax,
          coursesActivationMax: plan.limits.coursesActivationMax,
          storageGB: plan.limits.storageGB,
          adminsMax: plan.limits.adminsMax,
        },
      },
      { upsert: true, new: true },
    );

    return { message: 'Plan mis à jour', subscription: sub };
  }

  async cancelAtPeriodEnd(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) {
      throw new BadRequestException('Aucune souscription trouvée');
    }
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return { message: 'La souscription sera annulée à la fin de la période', subscription: sub };
  }

  async getMySubscription(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    return sub || null;
  }
}


