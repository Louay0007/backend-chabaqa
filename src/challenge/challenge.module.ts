import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { Challenge, ChallengeSchema } from '../schema/challenge.schema';
import { Community, CommunitySchema } from '../schema/community.schema';
import { User, UserSchema } from '../schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../common/modules/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    TrackingModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
  exports: [ChallengeService],
})
export class ChallengeModule {}
