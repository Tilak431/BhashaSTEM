'use server';
/**
 * @fileOverview A flow that summarizes text and translates it.
 *
 * - summarizeAndSpeak - A function that handles the entire process.
 * - SummarizeAndSpeakInput - The input type for the function.
 * - SummarizeAndSpeakOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAndSpeakInputSchema = z.object({
  text: z.string().describe('The text to summarize, translate, and speak.'),
  targetLanguage: z.string().describe('The language for the output.'),
});
export type SummarizeAndSpeakInput = z.infer<typeof SummarizeAndSpeakInputSchema>;

const SummarizeAndSpeakOutputSchema = z.object({
  summary: z.string().describe('The generated text summary.'),
});
export type SummarizeAndSpeakOutput = z.infer<typeof SummarizeAndSpeakOutputSchema>;


const summarizeAndTranslatePrompt = ai.definePrompt({
    name: 'summarizeAndTranslatePrompt',
    input: { schema: z.object({ text: z.string(), targetLanguage: z.string() }) },
    output: { schema: z.object({ translatedSummary: z.string() }) },
    prompt: `You are an expert educator creating a detailed audio summary of a lesson. Based on the provided transcript, create a comprehensive summary that captures all the main concepts, key explanations, and important examples. The summary should be thorough enough to produce an audio summary of approximately 1 minute and 30 seconds, giving a listener a deep understanding of the material as if they were listening to a condensed version of the original lecture.

After creating this detailed summary, translate it into {{{targetLanguage}}}.

Transcript:
{{{text}}}

Respond with a JSON object with a single key "translatedSummary" containing the translated summary. Your final output should ONLY be this JSON object.`,
});


const summarizeAndSpeakFlow = ai.defineFlow(
  {
    name: 'summarizeAndSpeakFlow',
    inputSchema: SummarizeAndSpeakInputSchema,
    outputSchema: SummarizeAndSpeakOutputSchema,
  },
  async ({ text, targetLanguage }) => {
    // Step 1: Summarize and Translate
    const { output: translationOutput } = await summarizeAndTranslatePrompt({ text, targetLanguage });
    if (!translationOutput?.translatedSummary) {
        throw new Error('Failed to generate translated summary.');
    }

    // Step 2: Return the text summary
    return {
      summary: translationOutput.translatedSummary,
    };
  }
);


export async function summarizeAndSpeak(
  input: SummarizeAndSpeakInput
): Promise<SummarizeAndSpeakOutput> {
  return summarizeAndSpeakFlow(input);
}
