import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event, EventSchema } from '../schema/event.schema';
import { Community, CommunitySchema } from '../schema/community.schema';
import { User, UserSchema } from '../schema/user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema }
    ]),
    AuthModule
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService]
})
export class EventModule {}

