// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import mongoose from 'mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User, UserSchema } from './schema/user.schema';
import { VerificationCode, VerificationCodeSchema } from './schema/verification-code.schema';
import { RevokedToken, RevokedTokenSchema } from './schema/revoked-token.schema';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { AuthModule } from './auth/auth.module';
import { EmailService } from './common/services/email.service';
import { CommunityAffCreaJoinModule } from './community-aff-crea-join/community-aff-crea-join.module';
import { Community, CommunitySchema } from './schema/community.schema';
import { ResourceModule } from './resource/resource.module';
import { AdminModule } from './admin/admin.module';
import { CoursModule } from './cours/cours.module';
import { UploadModule } from './upload/upload.module';
import { CourseEnrollmentModule } from './course-enrollment/course-enrollment.module';
import { ProductModule } from './product/product.module';
import { ChallengeModule } from './challenge/challenge.module';
import { SessionModule } from './session/session.module';
import { PostModule } from './post/post.module';
import { EventModule } from './event/event.module';
import { TrackingModule } from './common/modules/tracking.module';
import { TrackingController } from './common/controllers/tracking.controller';

@Module({
  imports: [
    // 1) charge .env globalement
    ConfigModule.forRoot({ isGlobal: true }),

    // 2) Configuration pour servir les fichiers statiques
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 3) connexion MongoDB Atlas + test immédiat
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
        connectionFactory: (connection) => {
          // log OK / KO
          connection.on('connected', async () => {
            console.log('✅ MongoDB connected!');

            /* --- test vivant : lister les collections --- */
            try {
              const cols = await connection.db.listCollections().toArray();
              console.log(
                '📊 MongoDB is alive. Collections:',
                cols.map((c) => c.name),
              );
            } catch (err) {
              console.error('❌ Test query failed:', err);
            }
          });

          connection.on('error', (err) =>
            console.error('❌ MongoDB connection error:', err),
          );

          return connection;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: RevokedToken.name, schema: RevokedTokenSchema },
      { name: Community.name, schema: CommunitySchema }
    ]),
    AuthModule,
    CommunityAffCreaJoinModule,
    ResourceModule,
    AdminModule,
    CoursModule,
    UploadModule,
    CourseEnrollmentModule,
    ProductModule,
    ChallengeModule,
    SessionModule,
    PostModule,
    EventModule,
    TrackingModule,
  ],
  controllers: [AppController, UserController, TrackingController],
  providers: [AppService, UserService, EmailService],
  exports: [EmailService],
})
export class AppModule {}
