'use server';

/**
 * @fileOverview A flow that answers STEM questions in the student's native language, supporting both text and speech input.
 *
 * - answerVernacularQuestion - A function that accepts a question in the student's native language and returns an answer or guidance.
 * - AnswerVernacularQuestionInput - The input type for the answerVernacularQuestion function.
 * - AnswerVernacularQuestionOutput - The return type for the answerVernacularQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerVernacularQuestionInputSchema = z.object({
  question: z
    .string()
    .describe('The question asked by the student in their native language.'),
  language: z.string().describe('The native language of the student.'),
});
export type AnswerVernacularQuestionInput = z.infer<
  typeof AnswerVernacularQuestionInputSchema
>;

const AnswerVernacularQuestionOutputSchema = z.object({
  answer: z
    .string()
    .describe('The answer to the question in the student\'s native language.'),
});
export type AnswerVernacularQuestionOutput = z.infer<
  typeof AnswerVernacularQuestionOutputSchema
>;

export async function answerVernacularQuestion(
  input: AnswerVernacularQuestionInput
): Promise<AnswerVernacularQuestionOutput> {
  return answerVernacularQuestionFlow(input);
}

const answerVernacularQuestionPrompt = ai.definePrompt({
  name: 'answerVernacularQuestionPrompt',
  input: {schema: AnswerVernacularQuestionInputSchema},
  output: {schema: AnswerVernacularQuestionOutputSchema},
  prompt: `You are a helpful STEM tutor. A student will ask a question in their native language, and you will respond with an answer or guidance in the same language.

  Language: {{{language}}}
  Question: {{{question}}}
  `,
});

const answerVernacularQuestionFlow = ai.defineFlow(
  {
    name: 'answerVernacularQuestionFlow',
    inputSchema: AnswerVernacularQuestionInputSchema,
    outputSchema: AnswerVernacularQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerVernacularQuestionPrompt(input);
    return output!;
  }
);
