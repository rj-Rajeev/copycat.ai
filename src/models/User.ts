// models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    // You can add fields later (email, name, etc.)
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
