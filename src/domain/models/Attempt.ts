import { StructuredTextSubmissionContent, Submission } from "./Submission";

export type AttemptStatus = "DRAFT" | "SUBMITTED" | "EVALUATING" | "COMPLETED" | "FAILED";

export interface Attempt {
  id: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  draftContent: StructuredTextSubmissionContent;
  submission: Submission | null;
  evaluationId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
}

export function createInitialDraftContent(): StructuredTextSubmissionContent {
  return {
    assumptions: "",
    classes: [
      {
        id: "class-1",
        name: "",
        responsibility: "",
        attributes: [],
        methods: [],
      },
    ],
    interfaces: [],
    relationships: [],
    workflows: [],
    designPatterns: [],
    extensibility: "",
    edgeCases: "",
    explanation: "",
  };
}
