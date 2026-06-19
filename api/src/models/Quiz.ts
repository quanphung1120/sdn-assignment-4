import { InferSchemaType, model, Schema } from 'mongoose';

const quizSchema = new Schema({
  title: { type: String, required: true, default: '' },
  description: { type: String, default: '' },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
});

type Quiz = InferSchemaType<typeof quizSchema>;

export const QuizModel = model<Quiz>('Quiz', quizSchema);
