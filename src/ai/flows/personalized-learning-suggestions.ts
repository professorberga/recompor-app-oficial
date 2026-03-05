'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI Learning Insight Assistant.
 * It synthesizes student assessment data and observational notes to generate
 * personalized learning suggestions and progress summaries.
 *
 * - personalizedLearningSuggestions - The main function to trigger the AI insight generation.
 * - PersonalizedLearningSuggestionsInput - The input type for the function.
 * - PersonalizedLearningSuggestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssessmentEntrySchema = z.object({
  competency: z.string().describe("The Bloom's Taxonomy competency level (e.g., 'Remembering', 'Understanding', 'Applying')."),
  skill: z.string().describe('The specific skill assessed.'),
  score: z.number().describe('A numerical score or achievement level for the skill (e.g., 0-100).'),
  notes: z.string().optional().describe('Optional specific notes for this assessment.'),
});

const PersonalizedLearningSuggestionsInputSchema = z.object({
  studentName: z.string().describe('The full name of the student.'),
  assessmentData: z.array(AssessmentEntrySchema).describe('An array of assessment results, including competency, skill, score, and notes.'),
  observationalNotes: z.array(z.string()).describe('An array of qualitative observational notes about the student.'),
  teacherInstructions: z.string().optional().describe('Optional specific instructions or focus areas from the teacher for the AI.'),
});
export type PersonalizedLearningSuggestionsInput = z.infer<typeof PersonalizedLearningSuggestionsInputSchema>;

const PersonalizedLearningSuggestionsOutputSchema = z.object({
  progressSummary: z.string().describe('A comprehensive summary of the student\u0027s overall progress and current standing.'),
  strengths: z.array(z.string()).describe('A list of identified strengths of the student.'),
  areasForImprovement: z.array(z.string()).describe('A list of areas where the student needs improvement or further development.'),
  learningSuggestions: z.array(z.string()).describe('A list of personalized and actionable learning suggestions for the student.'),
});
export type PersonalizedLearningSuggestionsOutput = z.infer<typeof PersonalizedLearningSuggestionsOutputSchema>;

export async function personalizedLearningSuggestions(input: PersonalizedLearningSuggestionsInput): Promise<PersonalizedLearningSuggestionsOutput> {
  return personalizedLearningSuggestionsFlow(input);
}

const personalizedLearningSuggestionsPrompt = ai.definePrompt({
  name: 'personalizedLearningSuggestionsPrompt',
  input: { schema: PersonalizedLearningSuggestionsInputSchema },
  output: { schema: PersonalizedLearningSuggestionsOutputSchema },
  prompt: `You are an AI Learning Insight Assistant designed to help teachers provide targeted feedback and support to students. Your task is to analyze assessment data and observational notes for a student and then generate personalized learning suggestions and a comprehensive progress summary.

Student Name: {{{studentName}}}

Assessment Data:
{{#each assessmentData}}
- Competency: {{{this.competency}}}, Skill: {{{this.skill}}}, Score: {{{this.score}}}{{#if this.notes}}, Notes: {{{this.notes}}}{{/if}}
{{/each}}

Observational Notes:
{{#each observationalNotes}}
- {{{this}}}
{{/each}}

{{#if teacherInstructions}}
Teacher's specific instructions/focus areas: {{{teacherInstructions}}}
{{/if}}

Based on the provided information, identify the student's key strengths and areas for improvement. Then, draft a concise progress summary and provide actionable, personalized learning suggestions. Ensure the suggestions are constructive and aim to foster the student's growth.

Your output should strictly adhere to the JSON schema for PersonalizedLearningSuggestionsOutput.`,
});

const personalizedLearningSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedLearningSuggestionsFlow',
    inputSchema: PersonalizedLearningSuggestionsInputSchema,
    outputSchema: PersonalizedLearningSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedLearningSuggestionsPrompt(input);
    return output!;
  },
);
