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

// Schema for prompt input (includes calculated label)
const BloomPromptInputSchema = BloomAssessmentItemGeneratorInputSchema.extend({
  subjectLabel: z.string()
});

// Prompt definition
const bloomAssessmentItemGeneratorPrompt = ai.definePrompt({
  name: 'bloomAssessmentItemGeneratorPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: BloomPromptInputSchema },
  output: { schema: BloomAssessmentItemGeneratorOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `Você é um assistente de IA especializado em educação brasileira (BNCC), capaz de gerar itens de avaliação pedagógica.
Sua tarefa é criar {{numItems}} itens de avaliação para a disciplina de "{{subjectLabel}}", focando na competência: "{{competency}}".
Estes itens devem ser elaborados para o nível da Taxonomia de Bloom: "{{bloomLevel}}".

REGRAS IMPORTANTES:
1. Toda a saída deve estar em Português do Brasil (pt-BR).
2. O conteúdo deve ser apropriado para o ambiente escolar.
3. Se o nível for 'Remember', peça definições ou fatos.
4. Se o nível for 'Apply', crie problemas práticos.
5. Se o nível for 'Create', peça a produção de algo novo.

As questões devem ser claras, diretas e prontas para uso em sala de aula.`
});

// Genkit Flow definition
const bloomAssessmentItemGeneratorFlow = ai.defineFlow(
  {
    name: 'bloomAssessmentItemGeneratorFlow',
    inputSchema: BloomAssessmentItemGeneratorInputSchema,
    outputSchema: BloomAssessmentItemGeneratorOutputSchema,
  },
  async (input) => {
    try {
      const subjectLabel = input.subject === 'Portuguese' ? 'Língua Portuguesa' : 'Matemática';
      const { output } = await bloomAssessmentItemGeneratorPrompt({
        ...input,
        subjectLabel
      });
      
      if (!output) {
        throw new Error('IA não retornou itens de avaliação.');
      }
      
      return output;
    } catch (error) {
      console.error("[Flow Error] bloomAssessmentItemGeneratorFlow:", error);
      throw error;
    }
  }
);

// Wrapper function
export async function generateBloomAssessmentItems(
  input: BloomAssessmentItemGeneratorInput
): Promise<BloomAssessmentItemGeneratorOutput> {
  return bloomAssessmentItemGeneratorFlow(input);
}
