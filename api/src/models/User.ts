import { InferSchemaType, model, Schema } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

type User = InferSchemaType<typeof userSchema>;

export const UserModel = model<User>('User', userSchema);
