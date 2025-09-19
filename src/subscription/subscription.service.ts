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

    // Require billing method before starting trial
    const needsBilling = existing && existing.hasPaymentMethod === true ? false : true;
    const hasBilling = existing?.hasPaymentMethod === true;
    if (!hasBilling) {
      throw new BadRequestException("Un moyen de paiement doit être configuré avant de démarrer l'essai gratuit");
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

  async setupBillingMethod(creatorId: string | Types.ObjectId, body: { providerCustomerId: string; paymentBrand?: string; paymentLast4?: string }) {
    if (!body?.providerCustomerId) {
      throw new BadRequestException('providerCustomerId requis');
    }
    const sub = await this.subModel.findOneAndUpdate(
      { creatorId: new Types.ObjectId(creatorId as any) },
      {
        $set: {
          provider: body.paymentBrand ? 'custom' : 'custom',
          providerCustomerId: body.providerCustomerId,
          hasPaymentMethod: true,
          paymentBrand: body.paymentBrand,
          paymentLast4: body.paymentLast4,
        },
      },
      { upsert: true, new: true },
    );

    return { message: 'Moyen de paiement enregistré', subscription: sub };
  }

  // Called by cron or before guarded actions to auto-activate expired trials
  async ensureActiveOrTrial(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) return null;
    const now = new Date();
    if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndsAt && sub.trialEndsAt.getTime() <= now.getTime()) {
      if (sub.hasPaymentMethod) {
        // Auto-activate to STARTER (stub billing capture; in real flow, create provider sub)
        sub.status = SubscriptionStatus.ACTIVE;
        sub.currentPeriodStart = now;
        sub.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await sub.save();
      } else {
        // Trial ended without billing: remain not active; policy will block activation
        return sub;
      }
    }
    return sub;
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

  async getTrialRemaining(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) {
      return {
        isTrialing: false,
        expiresAt: null,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
        message: 'No subscription found',
      };
    }

    const now = new Date();
    const expiresAt = sub.trialEndsAt || null;
    const isTrialing = sub.status === SubscriptionStatus.TRIALING && !!expiresAt && expiresAt.getTime() > now.getTime();

    if (!isTrialing) {
      return {
        isTrialing: false,
        expiresAt,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
        message: 'Not in trial',
      };
    }

    const diffMs = expiresAt!.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      isTrialing: true,
      expiresAt,
      remaining: { days, hours, minutes, seconds, totalMs: diffMs },
      message: 'Trial active',
    };
  }
}


