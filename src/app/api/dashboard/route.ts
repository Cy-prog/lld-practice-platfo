import { NextResponse } from "next/server";
import { problemService, attemptService, evaluationRepository } from "@/application/container";

export async function GET() {
  try {
    const problems = await problemService.getAllProblems();
    const attempts = await attemptService.getAttempts();
    const evaluations = await evaluationRepository.findAll();

    const evalMap = new Map(evaluations.map((e) => [e.id, e]));

    const completedAttempts = attempts.filter(
      (a) => a.status === "COMPLETED" && a.evaluationId
    );

    const scores = completedAttempts
      .map((a) => evalMap.get(a.evaluationId!)?.overallScore)
      .filter((s): s is number => typeof s === "number");

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length)
        : 0;

    const practicedProblemIds = new Set(attempts.map((a) => a.problemId));

    // Map recent attempts
    const recentAttempts = attempts.slice(0, 6).map((att) => {
      const problem = problems.find((p) => p.id === att.problemId);
      const evalItem = att.evaluationId ? evalMap.get(att.evaluationId) : null;
      return {
        id: att.id,
        problemId: att.problemId,
        problemTitle: problem ? problem.title : "Unknown Problem",
        attemptNumber: att.attemptNumber,
        status: att.status,
        score: evalItem?.overallScore ?? null,
        createdAt: att.createdAt,
      };
    });

    // Calculate recurring weak criteria across evaluations
    const criterionScores: Record<string, { total: number; count: number; name: string }> = {};
    for (const ev of evaluations) {
      for (const crit of ev.criteria) {
        if (!criterionScores[crit.criterionKey]) {
          criterionScores[crit.criterionKey] = { total: 0, count: 0, name: crit.name };
        }
        criterionScores[crit.criterionKey].total += crit.score;
        criterionScores[crit.criterionKey].count += 1;
      }
    }

    const areasNeedingImprovement = Object.entries(criterionScores)
      .map(([key, data]) => ({
        key,
        name: data.name,
        averageScore: Math.round(data.total / data.count),
      }))
      .filter((a) => a.averageScore < 75)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3);

    // Identify continue practicing item
    const inProgressAttempt = attempts.find(
      (a) => a.status === "DRAFT" || a.status === "SUBMITTED" || a.status === "EVALUATING"
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProblems: problems.length,
        problemsPracticed: practicedProblemIds.size,
        attemptsCompleted: completedAttempts.length,
        averageScore,
        recentAttempts,
        areasNeedingImprovement,
        continuePracticingAttemptId: inProgressAttempt?.id || null,
        continuePracticingProblemId: inProgressAttempt?.problemId || problems[0]?.id || null,
      },
    });
  } catch (err: any) {
    console.error("GET /api/dashboard error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
