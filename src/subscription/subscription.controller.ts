import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { PlanTier } from '../schema/plan.schema';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('start-trial')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start 7-day trial on STARTER plan for current creator' })
  async startTrial(@Request() req: any) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.startTrialForCreator(creatorId);
  }

  @Post('setup-billing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Setup billing method for current creator (store provider customer + masked info)' })
  @ApiBody({ schema: { type: 'object', properties: { providerCustomerId: { type: 'string' }, paymentBrand: { type: 'string' }, paymentLast4: { type: 'string' } }, required: ['providerCustomerId'] } })
  async setupBilling(@Request() req: any, @Body() body: any) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.setupBillingMethod(creatorId, body);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upgrade plan tier (manual/stubbed until provider is integrated)' })
  @ApiBody({ schema: { type: 'object', properties: { tier: { type: 'string', enum: Object.values(PlanTier) } }, required: ['tier'] } })
  async upgrade(@Request() req: any, @Body('tier') tier: PlanTier) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.upgradePlan(creatorId, tier);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel at period end' })
  async cancel(@Request() req: any) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.cancelAtPeriodEnd(creatorId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my subscription' })
  async me(@Request() req: any) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.getMySubscription(creatorId);
  }

  @Get('trial-remaining')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get remaining time for current creator\'s trial (days/hours/minutes/seconds)' })
  async trialRemaining(@Request() req: any) {
    const creatorId = req.user._id || req.user.sub;
    return this.subscriptionService.getTrialRemaining(creatorId);
  }
}


