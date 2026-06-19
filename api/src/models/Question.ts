import { InferSchemaType, model, Schema } from 'mongoose';

const questionSchema = new Schema({
  text: { type: String, required: true, default: "" },
  author: { type: Schema.Types.ObjectId, ref: "User" },
  options: [String],
  keywords: [String],
  correctAnswerIndex: { type: Number, required: true, default: 0 }
});

type Question = InferSchemaType<typeof questionSchema>;

export const QuestionModel = model<Question>('Question', questionSchema);
