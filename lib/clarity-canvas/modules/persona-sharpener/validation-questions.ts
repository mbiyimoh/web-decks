/**
 * Question filtering for validation mode
 *
 * Validation questions use second-person framing (validationQuestion field)
 * to ask real potential customers about themselves rather than asking
 * founders about their assumptions.
 */

import type { Question } from './types';
import { questionBank } from './questions';

/**
 * Filter questions to only include those suitable for validation
 * (questions that have a validationQuestion property)
 */
export function getValidationQuestions(): Question[] {
  const allQuestions: Question[] = [];

  for (const category of Object.values(questionBank)) {
    for (const question of category) {
      // Only include questions that have validation framing
      if (question.validationQuestion) {
        allQuestions.push(question);
      }
    }
  }

  return allQuestions;
}

/**
 * Get validation questions for a specific category
 */
export function getValidationQuestionsByCategory(category: string): Question[] {
  const questions = questionBank[category] || [];
  return questions.filter(q => q.validationQuestion);
}

/**
 * Get the question text to display based on mode
 */
export function getQuestionText(question: Question, isValidation: boolean): string {
  if (isValidation && question.validationQuestion) {
    return question.validationQuestion;
  }
  return question.question;
}

/**
 * Get question IDs that were answered in founder mode
 * Used to show only the questions founders actually answered
 */
export function getAnsweredQuestionIds(founderResponses: Array<{ questionId: string }>): Set<string> {
  return new Set(founderResponses.map(r => r.questionId));
}

/**
 * Filter validation questions to only those the founder answered
 */
export function getMatchingValidationQuestions(
  founderResponses: Array<{ questionId: string }>
): Question[] {
  const answeredIds = getAnsweredQuestionIds(founderResponses);
  const validationQuestions = getValidationQuestions();

  return validationQuestions.filter(q => answeredIds.has(q.id));
}
