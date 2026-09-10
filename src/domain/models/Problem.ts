export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Problem {
  id: string;
  title: string;
  shortDescription: string;
  difficulty: DifficultyLevel;
  estimatedTimeMinutes: number;
  statement: string;
  functionalRequirements: string[];
  businessRules: string[];
  constraints: string[];
  assumptions: string[];
  expectedDesignAreas: string[];
  hints: string[];
  tags: string[];
}
