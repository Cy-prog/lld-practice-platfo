import React from "react";
import Link from "next/link";
import { Clock, ArrowRight, CheckCircle2, RotateCw } from "lucide-react";
import { ProblemWithStats } from "@/application/services/ProblemService";
import { DifficultyBadge, StatusBadge, ScorePill } from "@/components/common/Badges";

export default function ProblemCard({ problem }: { problem: ProblemWithStats }) {
  const hasAttempt = Boolean(problem.latestAttemptId);
  const isInProgress = problem.status === "IN_PROGRESS";
  const isCompleted = problem.status === "COMPLETED";

  return (
    <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-blue-950/10 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
        </div>

        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
          <Link href={`/problems/${problem.id}`}>{problem.title}</Link>
        </h3>

        <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {problem.shortDescription}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {problem.estimatedTimeMinutes} min
          </span>
          {problem.attemptsCount > 0 && (
            <span className="flex items-center gap-1">
              <span>{problem.attemptsCount} {problem.attemptsCount === 1 ? "attempt" : "attempts"}</span>
              {problem.bestScore !== null && (
                <span className="ml-1">
                  (Best: <ScorePill score={problem.bestScore} />)
                </span>
              )}
            </span>
          )}
        </div>

        <div>
          {isInProgress && problem.latestAttemptId ? (
            <Link
              href={`/attempts/${problem.latestAttemptId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Resume
            </Link>
          ) : isCompleted && problem.latestAttemptId ? (
            <Link
              href={`/attempts/${problem.latestAttemptId}/feedback`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Review
            </Link>
          ) : (
            <Link
              href={`/problems/${problem.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white group-hover:translate-x-0.5 transition-all"
            >
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
