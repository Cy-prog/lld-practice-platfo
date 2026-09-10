import React from "react";
import { DifficultyLevel } from "@/domain/models/Problem";
import { AttemptStatus } from "@/domain/models/Attempt";
import { ProblemPracticeStatus } from "@/application/services/ProblemService";

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const styles: Record<DifficultyLevel, string> = {
    BEGINNER: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    INTERMEDIATE: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    ADVANCED: "bg-rose-950/60 text-rose-400 border-rose-800/60",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: AttemptStatus | ProblemPracticeStatus | string;
}) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    NOT_STARTED: {
      bg: "bg-slate-800/80 border-slate-700 text-slate-400",
      text: "Not Started",
      label: "Not Started",
    },
    DRAFT: {
      bg: "bg-slate-800/90 border-slate-600 text-slate-300",
      text: "Draft",
      label: "Draft",
    },
    IN_PROGRESS: {
      bg: "bg-blue-950/60 border-blue-800/80 text-blue-300",
      text: "In Progress",
      label: "In Progress",
    },
    SUBMITTED: {
      bg: "bg-indigo-950/60 border-indigo-800/80 text-indigo-300",
      text: "Submitted",
      label: "Submitted",
    },
    EVALUATING: {
      bg: "bg-purple-950/60 border-purple-800/80 text-purple-300 animate-pulse",
      text: "Evaluating...",
      label: "Evaluating",
    },
    COMPLETED: {
      bg: "bg-emerald-950/60 border-emerald-800/80 text-emerald-300",
      text: "Completed",
      label: "Completed",
    },
    NEEDS_IMPROVEMENT: {
      bg: "bg-amber-950/60 border-amber-800/80 text-amber-300",
      text: "Needs Improvement",
      label: "Needs Improvement",
    },
    FAILED: {
      bg: "bg-rose-950/60 border-rose-800/80 text-rose-300",
      text: "Evaluation Failed",
      label: "Failed",
    },
  };

  const item = styles[status] || styles.NOT_STARTED;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.bg}`}
    >
      {item.text}
    </span>
  );
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-slate-500 font-mono">—</span>;
  }

  let color = "text-emerald-400 border-emerald-800/60 bg-emerald-950/30";
  if (score < 60) {
    color = "text-rose-400 border-rose-800/60 bg-rose-950/30";
  } else if (score < 75) {
    color = "text-amber-400 border-amber-800/60 bg-amber-950/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${color}`}
    >
      {score}/100
    </span>
  );
}
