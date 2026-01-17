
'use server';
/**
 * @fileOverview A flow that summarizes text, translates it, and generates audio.
 *
 * - summarizeAndSpeak - A function that handles the entire process.
 * - SummarizeAndSpeakInput - The input type for the function.
 * - SummarizeAndSpeakOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

export const SummarizeAndSpeakInputSchema = z.object({
  text: z.string().describe('The text to summarize, translate, and speak.'),
  targetLanguage: z.string().describe('The language for the audio output.'),
});
export type SummarizeAndSpeakInput = z.infer<typeof SummarizeAndSpeakInputSchema>;

export const SummarizeAndSpeakOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a base64 data URI.'),
});
export type SummarizeAndSpeakOutput = z.infer<typeof SummarizeAndSpeakOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const summarizeAndTranslatePrompt = ai.definePrompt({
    name: 'summarizeAndTranslatePrompt',
    input: { schema: z.object({ text: z.string(), targetLanguage: z.string() }) },
    output: { schema: z.object({ translatedSummary: z.string() }) },
    prompt: `Summarize the following text in 1-2 concise sentences. Then, translate that summary into {{{targetLanguage}}}.

    Text:
    {{{text}}}

    Your final output should ONLY be the translated summary.
    `,
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
    const translatedSummary = translationOutput.translatedSummary;

    // Step 2: Text-to-Speech
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard voice
                },
            },
        },
        prompt: translatedSummary,
    });

    if (!media) {
      throw new Error('TTS media generation failed.');
    }
    
    // Step 3: Convert to WAV
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


export async function summarizeAndSpeak(
  input: SummarizeAndSpeakInput
): Promise<SummarizeAndSpeakOutput> {
  return summarizeAndSpeakFlow(input);
}
