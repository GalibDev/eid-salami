import mongoose, { Model, Schema } from "mongoose";

export type PrizeDocument = {
  amount: number;
  chancePercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const PrizeSchema = new Schema<PrizeDocument>(
  {
    amount: { type: Number, required: true, min: 1, unique: true },
    chancePercent: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Prize = (mongoose.models.Prize as Model<PrizeDocument>) || mongoose.model<PrizeDocument>("Prize", PrizeSchema);

export default Prize;
