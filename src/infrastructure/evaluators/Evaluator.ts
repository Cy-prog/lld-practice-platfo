import { Problem } from "../../domain/models/Problem";
import { Submission } from "../../domain/models/Submission";
import { Rubric } from "../../domain/models/Rubric";
import { Evaluation, EvaluatorType } from "../../domain/models/Evaluation";

export interface EvaluationContext {
  problem: Problem;
  submission: Submission;
  rubric: Rubric;
}

export interface IEvaluator {
  readonly type: EvaluatorType;
  evaluate(context: EvaluationContext): Promise<Evaluation>;
}
