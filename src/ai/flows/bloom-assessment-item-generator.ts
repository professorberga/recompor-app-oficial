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
  prompt: `Você é um assistente de IA especializado em educação, capaz de gerar itens de avaliação para alunos com base na Taxonomia de Bloom.
Sua tarefa é criar {{numItems}} itens de avaliação (questões ou atividades) para a disciplina de "{{#if (eq subject 'Portuguese')}}Língua Portuguesa{{else}}Matemática{{/if}}", focando na competência: "{{competency}}".
Esses itens devem estar alinhados ao nível da Taxonomia de Bloom: "{{bloomLevel}}".

IMPORTANTE: Toda a saída (questões, enunciados e atividades) deve ser escrita estritamente em Português do Brasil (pt-BR).

Exemplos para níveis da Taxonomia de Bloom:
- Remember (Lembrar): Recordar fatos e conceitos básicos (ex: "Liste os personagens principais da história.")
- Understand (Entender): Explicar ideias ou conceitos (ex: "Explique por que o personagem tomou essa decisão.")
- Apply (Aplicar): Usar informações em novas situações (ex: "Se você fosse o personagem, como resolveria este problema?")
- Analyze (Analisar): Estabelecer conexões entre ideias (ex: "Compare e contraste as motivações dos dois personagens principais.")
- Evaluate (Avaliar): Justificar uma posição ou decisão (ex: "Você concorda com a mensagem do autor? Por quê?")
- Create (Criar): Produzir um trabalho novo ou original (ex: "Escreva um conto continuando a trama após o fim do livro.")

Certifique-se de que os itens gerados sejam apropriados para a disciplina e competência especificadas.
A saída deve ser um objeto JSON com uma única chave 'items', que é uma matriz de strings.`
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
