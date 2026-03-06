'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI Learning Insight Assistant.
 * It synthesizes student assessment data and observational notes to generate
 * personalized learning suggestions and progress summaries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssessmentEntrySchema = z.object({
  competency: z.string().describe("The Bloom's Taxonomy competency level."),
  skill: z.string().describe('The specific skill assessed.'),
  score: z.number().describe('A numerical score for the skill.'),
  notes: z.string().optional().describe('Optional specific notes.'),
});

const PersonalizedLearningSuggestionsInputSchema = z.object({
  studentName: z.string().describe('The full name of the student.'),
  assessmentData: z.array(AssessmentEntrySchema).describe('An array of assessment results.'),
  observationalNotes: z.array(z.string()).describe('An array of qualitative observational notes.'),
  teacherInstructions: z.string().optional().describe('Optional instructions from the teacher.'),
});
export type PersonalizedLearningSuggestionsInput = z.infer<typeof PersonalizedLearningSuggestionsInputSchema>;

const PersonalizedLearningSuggestionsOutputSchema = z.object({
  progressSummary: z.string().describe('Summary of the student\'s progress.'),
  strengths: z.array(z.string()).describe('Identified strengths.'),
  areasForImprovement: z.array(z.string()).describe('Areas for development.'),
  learningSuggestions: z.array(z.string()).describe('Actionable learning suggestions.'),
});
export type PersonalizedLearningSuggestionsOutput = z.infer<typeof PersonalizedLearningSuggestionsOutputSchema>;

const personalizedLearningSuggestionsPrompt = ai.definePrompt({
  name: 'personalizedLearningSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: PersonalizedLearningSuggestionsInputSchema },
  output: { schema: PersonalizedLearningSuggestionsOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `Você é um Assistente de Insights de Aprendizagem. Analise os dados do estudante e gere um relatório em Português do Brasil.

Estudante: {{studentName}}

Dados de Avaliação:
{{#each assessmentData}}
- Competência: {{this.competency}}, Habilidade: {{this.skill}}, Nota: {{this.score}}
{{/each}}

Notas Observacionais:
{{#each observationalNotes}}
- {{this}}
{{/each}}

{{#if teacherInstructions}}
Foco Adicional: {{teacherInstructions}}
{{/if}}

Gere um resumo construtivo, identifique forças, pontos de atenção e sugira 3 atividades práticas para o desenvolvimento do aluno.`,
});

const personalizedLearningSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedLearningSuggestionsFlow',
    inputSchema: PersonalizedLearningSuggestionsInputSchema,
    outputSchema: PersonalizedLearningSuggestionsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await personalizedLearningSuggestionsPrompt(input);
      if (!output) throw new Error('Falha na geração de insights.');
      return output;
    } catch (error) {
      console.error("[Flow Error] personalizedLearningSuggestionsFlow:", error);
      throw error;
    }
  },
);

export async function personalizedLearningSuggestions(input: PersonalizedLearningSuggestionsInput): Promise<PersonalizedLearningSuggestionsOutput> {
  return personalizedLearningSuggestionsFlow(input);
}
