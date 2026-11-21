import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      ret.userId = String(ret.userId);
      delete ret._id;
      return ret;
    },
  },
})
export class Session {
  id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  createdAt: Date;

  @Prop({ type: Date, default: null })
  terminatedAt: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ userId: 1, terminatedAt: 1 });
