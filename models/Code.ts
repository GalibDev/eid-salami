import mongoose, { Model, Schema } from "mongoose";

export type CodeDocument = {
  code: string;
  isUsed: boolean;
  prizeWon: number | null;
  redeemerName: string;
  claimPhone: string;
  claimedAt: Date | null;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const CodeSchema = new Schema<CodeDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isUsed: { type: Boolean, default: false, index: true },
    prizeWon: { type: Number, default: null },
    redeemerName: { type: String, default: "", trim: true },
    claimPhone: { type: String, default: "", trim: true },
    claimedAt: { type: Date, default: null },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Code = (mongoose.models.Code as Model<CodeDocument>) || mongoose.model<CodeDocument>("Code", CodeSchema);

export default Code;
