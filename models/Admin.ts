import mongoose, { Model, Schema } from "mongoose";

export type AdminDocument = {
  name: string;
  username: string;
  email: string;
  googleId: string;
  authProvider: string;
  profileImageUrl: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const AdminSchema = new Schema<AdminDocument>(
  {
    name: { type: String, required: true, trim: true, default: "Owner" },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    googleId: { type: String, default: "", index: true },
    authProvider: { type: String, default: "password" },
    profileImageUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const Admin = (mongoose.models.Admin as Model<AdminDocument>) || mongoose.model<AdminDocument>("Admin", AdminSchema);

export default Admin;
