import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    UsersModule,
  ],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule { }
