import mongoose from "mongoose";

const schema = new mongoose.Schema(
  { email: { type: String, required: true, unique: true, lowercase: true, trim: true } },
  { timestamps: true }
);

export default mongoose.models.EmailSubscriber ||
  mongoose.model("EmailSubscriber", schema);
