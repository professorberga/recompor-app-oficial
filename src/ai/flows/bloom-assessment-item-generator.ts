'use server';
/**
 * @fileOverview A Genkit flow for generating assessment items based on competency and Bloom's Taxonomy level.
 *
 * - generateBloomAssessmentItems - A function that handles the generation of assessment items.
 * - BloomAssessmentItemGeneratorInput - The input type for the generateBloomAssessmentItems function.
 * - BloomAssessmentItemGeneratorOutput - The return type for the generateBloomAssessmentItems function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const BloomAssessmentItemGeneratorInputSchema = z.object({
  subject: z.enum(['Portuguese', 'Math']).describe('The subject (Portuguese or Math) for which to generate assessment items.'),
  competency: z.string().describe('The specific competency for which to generate assessment items.'),
  bloomLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']).describe("Bloom's Taxonomy level for the assessment items."),
  numItems: z.number().int().min(1).max(10).default(3).describe('The number of assessment items to generate (1-10).')
});
export type BloomAssessmentItemGeneratorInput = z.infer<typeof BloomAssessmentItemGeneratorInputSchema>;

// Output Schema
const BloomAssessmentItemGeneratorOutputSchema = z.object({
  items: z.array(z.string()).describe('An array of generated assessment items (questions or activities).')
});
export type BloomAssessmentItemGeneratorOutput = z.infer<typeof BloomAssessmentItemGeneratorOutputSchema>;

// Prompt definition
const bloomAssessmentItemGeneratorPrompt = ai.definePrompt({
  name: 'bloomAssessmentItemGeneratorPrompt',
  input: { schema: BloomAssessmentItemGeneratorInputSchema },
  output: { schema: BloomAssessmentItemGeneratorOutputSchema },
  prompt: `You are an AI assistant specialized in education, capable of generating assessment items for students based on Bloom's Taxonomy.
Your task is to create {{numItems}} assessment items (questions or activities) for the subject of "{{subject}}", focusing on the competency: "{{competency}}".
These items should align with Bloom's Taxonomy level of "{{bloomLevel}}".

Examples for Bloom's Taxonomy levels:
- Remember: Recall facts and basic concepts (e.g., "List the main characters in the story.")
- Understand: Explain ideas or concepts (e.g., "Explain why the character made that decision.")
- Apply: Use information in new situations (e.g., "If you were the character, how would you solve this problem?")
- Analyze: Draw connections among ideas (e.g., "Compare and contrast the motivations of the two main characters.")
- Evaluate: Justify a stand or decision (e.g., "Do you agree with the author's message? Why or why not?")
- Create: Produce new or original work (e.g., "Write a short story continuing the plot after the book ends.")

Ensure the generated items are appropriate for the specified subject and competency.
The output should be a JSON object with a single key 'items', which is an array of strings.`
});

// Genkit Flow definition
const bloomAssessmentItemGeneratorFlow = ai.defineFlow(
  {
    name: 'bloomAssessmentItemGeneratorFlow',
    inputSchema: BloomAssessmentItemGeneratorInputSchema,
    outputSchema: BloomAssessmentItemGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await bloomAssessmentItemGeneratorPrompt(input);
    return output!;
  }
);

// Wrapper function
export async function generateBloomAssessmentItems(
  input: BloomAssessmentItemGeneratorInput
): Promise<BloomAssessmentItemGeneratorOutput> {
  return bloomAssessmentItemGeneratorFlow(input);
}
