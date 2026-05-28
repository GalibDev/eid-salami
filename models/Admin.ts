import mongoose, { Model, Schema } from "mongoose";

export type AdminDocument = {
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const AdminSchema = new Schema<AdminDocument>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const Admin = (mongoose.models.Admin as Model<AdminDocument>) || mongoose.model<AdminDocument>("Admin", AdminSchema);

export default Admin;
