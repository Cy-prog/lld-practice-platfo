import { Evaluation, CriterionEvaluation } from "../models/Evaluation";

export interface CriterionComparison {
  criterionKey: string;
  name: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  status: "IMPROVED" | "REGRESSED" | "UNCHANGED";
}

export interface AttemptComparisonResult {
  scoreDelta: number;
  previousScore: number;
  currentScore: number;
  criterionComparisons: CriterionComparison[];
  improvedCriteria: CriterionComparison[];
  regressedCriteria: CriterionComparison[];
  recurringWeaknesses: CriterionComparison[];
  summary: string;
}

export class AttemptComparator {
  static compare(
    currentEvaluation: Evaluation,
    previousEvaluation: Evaluation
  ): AttemptComparisonResult {
    const scoreDelta = currentEvaluation.overallScore - previousEvaluation.overallScore;

    const previousMap = new Map<string, CriterionEvaluation>();
    for (const c of previousEvaluation.criteria) {
      previousMap.set(c.criterionKey, c);
    }

    const criterionComparisons: CriterionComparison[] = [];
    const improvedCriteria: CriterionComparison[] = [];
    const regressedCriteria: CriterionComparison[] = [];
    const recurringWeaknesses: CriterionComparison[] = [];

    for (const curr of currentEvaluation.criteria) {
      const prev = previousMap.get(curr.criterionKey);
      const prevScore = prev ? prev.score : 0;
      const delta = curr.score - prevScore;

      let status: "IMPROVED" | "REGRESSED" | "UNCHANGED" = "UNCHANGED";
      if (delta > 0) status = "IMPROVED";
      else if (delta < 0) status = "REGRESSED";

      const comp: CriterionComparison = {
        criterionKey: curr.criterionKey,
        name: curr.name,
        previousScore: prevScore,
        currentScore: curr.score,
        delta,
        status,
      };

      criterionComparisons.push(comp);

      if (status === "IMPROVED") {
        improvedCriteria.push(comp);
      } else if (status === "REGRESSED") {
        regressedCriteria.push(comp);
      }

      // If both scored under 70, it's a recurring weakness
      if (curr.score < 70 && prevScore < 70) {
        recurringWeaknesses.push(comp);
      }
    }

    let summary = "";
    if (scoreDelta > 0) {
      summary = `Overall design score improved by +${scoreDelta} points. Great job addressing previous feedback!`;
    } else if (scoreDelta < 0) {
      summary = `Overall design score shifted by ${scoreDelta} points. Certain areas may need further consolidation.`;
    } else {
      summary = `Overall score remained consistent. Check individual criteria for nuanced shifts.`;
    }

    return {
      scoreDelta,
      previousScore: previousEvaluation.overallScore,
      currentScore: currentEvaluation.overallScore,
      criterionComparisons,
      improvedCriteria,
      regressedCriteria,
      recurringWeaknesses,
      summary,
    };
  }
}
