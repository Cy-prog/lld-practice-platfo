"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Clock,
  CheckCircle2,
  RotateCw,
  ArrowRight,
  TrendingUp,
  FileText,
  Filter,
} from "lucide-react";
import { Attempt } from "@/domain/models/Attempt";
import { Problem } from "@/domain/models/Problem";
import { StatusBadge, ScorePill } from "@/components/common/Badges";

export default function AttemptHistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Record<string, number>>({});
  const [selectedProblemFilter, setSelectedProblemFilter] = useState<string>("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const [attRes, probRes] = await Promise.all([
          fetch("/api/attempts"),
          fetch("/api/problems"),
        ]);

        const attJson = await attRes.json();
        const probJson = await probRes.json();

        if (attJson.success) setAttempts(attJson.data);
        if (probJson.success) setProblems(probJson.data);

        // Fetch scores for completed attempts
        if (attJson.success) {
          const completed = attJson.data.filter(
            (a: Attempt) => a.status === "COMPLETED" && a.evaluationId
          );

          const scoreMap: Record<string, number> = {};
          await Promise.all(
            completed.map(async (a: Attempt) => {
              try {
                const evalRes = await fetch(`/api/attempts/${a.id}/evaluate`);
                const evalJson = await evalRes.json();
                if (evalJson.success && evalJson.data.evaluation) {
                  scoreMap[a.id] = evalJson.data.evaluation.overallScore;
                }
              } catch (e) {
                // ignore
              }
            })
          );
          setEvaluations(scoreMap);
        }
      } catch (err) {
        console.error("Failed to load attempt history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleRetry = async (attemptId: string) => {
    setRetryingId(attemptId);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/retry`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/attempts/${json.data.id}`);
      } else {
        alert(json.error || "Failed to retry attempt.");
      }
    } catch (err: any) {
      alert("Retry error: " + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredAttempts = attempts.filter((att) => {
    if (selectedProblemFilter === "ALL") return true;
    return att.problemId === selectedProblemFilter;
  });

  // Group attempts by problem to show progression
  const problemGroups: Record<string, Attempt[]> = {};
  for (const att of attempts) {
    if (!problemGroups[att.problemId]) {
      problemGroups[att.problemId] = [];
    }
    problemGroups[att.problemId].push(att);
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
          <History className="w-4 h-4" />
          <span>Iterative Practice Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Attempt History
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Track design iterations across problems, review rubric feedback, and compare score improvements over time.
        </p>
      </div>

      {/* Filter */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase">Filter by Problem:</span>
          <select
            value={selectedProblemFilter}
            onChange={(e) => setSelectedProblemFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Problems ({attempts.length} attempts)</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/problems"
          className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
        >
          New Practice Session
        </Link>
      </div>

      {/* Progress Cards per Problem (if multiple attempts exist) */}
      {selectedProblemFilter === "ALL" && Object.keys(problemGroups).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Problem Progress Trajectories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(problemGroups).map(([probId, attList]) => {
              const prob = problems.find((p) => p.id === probId);
              // Sort ascending by attempt number
              const sorted = [...attList].sort((a, b) => a.attemptNumber - b.attemptNumber);
              const completedScores = sorted
                .filter((a) => a.status === "COMPLETED" && evaluations[a.id] !== undefined)
                .map((a) => ({ attemptNum: a.attemptNumber, score: evaluations[a.id] }));

              return (
                <div
                  key={probId}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-white truncate max-w-[180px]">
                      {prob ? prob.title : probId}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {attList.length} {attList.length === 1 ? "attempt" : "attempts"}
                    </span>
                  </div>

                  {completedScores.length > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-mono pt-1">
                      <span className="text-slate-400">Score line:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {completedScores.map((item, idx) => (
                          <React.Fragment key={item.attemptNum}>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                              #{item.attemptNum}: {item.score}
                            </span>
                            {idx < completedScores.length - 1 && (
                              <span className="text-slate-600">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">No completed evaluations yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempts Table / List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading attempt logs...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
          <History className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No attempts found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose a problem from the library and submit your first object-oriented design.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Explore Problems
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800/60">
          {filteredAttempts.map((att) => {
            const prob = problems.find((p) => p.id === att.problemId);
            const score = evaluations[att.id] ?? null;

            return (
              <div
                key={att.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={
                        att.status === "COMPLETED"
                          ? `/attempts/${att.id}/feedback`
                          : `/attempts/${att.id}`
                      }
                      className="font-semibold text-sm text-white hover:text-blue-400 transition-colors"
                    >
                      {prob?.title || "Unknown Problem"}
                    </Link>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Attempt #{att.attemptNumber}
                    </span>
                    <StatusBadge status={att.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(att.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ScorePill score={score} />

                  {att.status === "COMPLETED" ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/attempts/${att.id}/feedback`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        Feedback
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRetry(att.id)}
                        disabled={retryingId === att.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors inline-flex items-center gap-1"
                        title="Create new attempt based on this design"
                      >
                        <RotateCw className="w-3 h-3" />
                        {retryingId === att.id ? "Retrying..." : "Retry"}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={`/attempts/${att.id}`}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                    >
                      {att.status === "DRAFT" ? "Continue Draft" : "View Attempt"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
