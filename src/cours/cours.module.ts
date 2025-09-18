import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursController } from './cours.controller';
import { CoursService } from './cours.service';
import { CoursSchema, CourseEnrollmentSchema, CourseProgressSchema } from '../schema/course.schema';
import { CommunitySchema } from '../schema/community.schema';
import { UserSchema } from '../schema/user.schema';
import { UploadModule } from '../upload/upload.module';
import { TrackingModule } from '../common/modules/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Cours', schema: CoursSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: 'CourseProgress', schema: CourseProgressSchema },
      { name: 'Community', schema: CommunitySchema },
      { name: 'User', schema: UserSchema }
    ]),
    UploadModule, // Importer le module upload
    TrackingModule // Importer le module de tracking
  ],
  controllers: [CoursController],
  providers: [CoursService],
  exports: [CoursService]
})
export class CoursModule {} 