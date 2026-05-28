import mongoose, { Model, Schema } from "mongoose";

export type PrizeDocument = {
  amount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const PrizeSchema = new Schema<PrizeDocument>(
  {
    amount: { type: Number, required: true, min: 1, unique: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Prize = (mongoose.models.Prize as Model<PrizeDocument>) || mongoose.model<PrizeDocument>("Prize", PrizeSchema);

export default Prize;
