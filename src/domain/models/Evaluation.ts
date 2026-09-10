import { RubricCriterionKey } from "./Rubric";

export type EvaluatorType = "AI_GEMINI" | "MOCK_DETERMINISTIC" | "RULE_BASED";

export interface CriterionEvaluation {
  criterionKey: RubricCriterionKey;
  name: string;
  score: number; // 0 - 100
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number; // 0.0 - 1.0
}

export interface Evaluation {
  id: string;
  attemptId: string;
  evaluatorType: EvaluatorType;
  overallScore: number; // 0 - 100
  summary: string;
  criteria: CriterionEvaluation[];
  strengths: string[];
  improvements: string[];
  nextPracticeFocus: string;
  confidence: number; // 0.0 - 1.0
  createdAt: string;
}
