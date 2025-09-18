import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { Session, SessionSchema } from '../schema/session.schema';
import { Community, CommunitySchema } from '../schema/community.schema';
import { User, UserSchema } from '../schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../common/modules/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    TrackingModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
