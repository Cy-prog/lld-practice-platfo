import {
  ProblemRepository,
  AttemptRepository,
  EvaluationRepository,
} from "../infrastructure/persistence/Repositories";
import { ProblemService } from "./services/ProblemService";
import { AttemptService } from "./services/AttemptService";
import { EvaluationService } from "./services/EvaluationService";

// Singleton container for Dependency Injection
const problemRepository = new ProblemRepository();
const attemptRepository = new AttemptRepository();
const evaluationRepository = new EvaluationRepository();

export const problemService = new ProblemService(
  problemRepository,
  attemptRepository,
  evaluationRepository
);

export const attemptService = new AttemptService(
  attemptRepository,
  problemRepository
);

export const evaluationService = new EvaluationService(
  attemptRepository,
  problemRepository,
  evaluationRepository
);

export { problemRepository, attemptRepository, evaluationRepository };
