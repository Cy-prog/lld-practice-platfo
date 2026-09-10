"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  History,
  FileCode,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Attempt } from "@/domain/models/Attempt";
import { Problem } from "@/domain/models/Problem";
import { Evaluation } from "@/domain/models/Evaluation";
import { AttemptComparisonResult } from "@/domain/services/AttemptComparator";
import CriterionCard from "@/components/feedback/CriterionCard";
import ComparisonView from "@/components/feedback/ComparisonView";
import { DifficultyBadge, ScorePill } from "@/components/common/Badges";

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [comparison, setComparison] = useState<AttemptComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [showSubmissionSnapshot, setShowSubmissionSnapshot] = useState(false);

  useEffect(() => {
    async function loadFeedback() {
      try {
        const [attRes, evalRes, compRes] = await Promise.all([
          fetch(`/api/attempts/${attemptId}`),
          fetch(`/api/attempts/${attemptId}/evaluate`),
          fetch(`/api/attempts/${attemptId}/comparison`),
        ]);

        const attJson = await attRes.json();
        if (attJson.success) {
          const att: Attempt = attJson.data;
          setAttempt(att);

          const probRes = await fetch(`/api/problems/${att.problemId}`);
          const probJson = await probRes.json();
          if (probJson.success) setProblem(probJson.data);
        }

        const evalJson = await evalRes.json();
        if (evalJson.success && evalJson.data.evaluation) {
          setEvaluation(evalJson.data.evaluation);
        }

        const compJson = await compRes.json();
        if (compJson.success && compJson.data) {
          setComparison(compJson.data);
        }
      } catch (err) {
        console.error("Failed to load feedback:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, [attemptId]);

  const handleRetry = async () => {
    if (!attempt) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/retry`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/attempts/${json.data.id}`);
      } else {
        alert(json.error || "Failed to start retry attempt.");
      }
    } catch (err: any) {
      alert("Retry error: " + err.message);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading rubric evaluation feedback...</p>
      </div>
    );
  }

  if (!attempt || !evaluation) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Evaluation not available</h2>
        <p className="text-xs text-slate-400">
          This attempt may not have completed evaluation yet.
        </p>
        <Link
          href={`/attempts/${attemptId}`}
          className="text-sm text-blue-400 hover:underline"
        >
          Return to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/problems" className="hover:text-white transition-colors">
            Problems
          </Link>
          <span>/</span>
          {problem && (
            <Link
              href={`/problems/${problem.id}`}
              className="hover:text-white transition-colors"
            >
              {problem.title}
            </Link>
          )}
          <span>/</span>
          <span className="text-slate-300 font-mono">Attempt #{attempt.attemptNumber} Feedback</span>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {retrying ? "Creating Retry..." : "Retry with Improvements"}
        </button>
      </div>

      {/* Overall Score & Summary Header */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Rubric-Based Design Evaluation
              </span>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                Evaluator: {evaluation.evaluatorType}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {problem?.title || "Design Evaluation"}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Evaluated on {new Date(evaluation.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Overall Score</span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-white mt-0.5">
                {evaluation.overallScore}
                <span className="text-xs text-slate-500 font-normal ml-1">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Confidence</span>
              <div className="text-base font-mono font-semibold text-blue-400 mt-1">
                {Math.round(evaluation.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-sm text-slate-300 leading-relaxed">
          {evaluation.summary}
        </div>

        {/* Next Practice Focus Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-800/50 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Next Practice Focus
            </h4>
            <p className="text-sm font-medium text-white leading-relaxed">
              {evaluation.nextPracticeFocus}
            </p>
          </div>
        </div>
      </div>

      {/* Comparative View if previous attempt exists */}
      {comparison && <ComparisonView comparison={comparison} />}

      {/* Strengths & Actionable Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <h3>What You Did Well</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {evaluation.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-2xl border border-amber-900/40 bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <h3>Areas To Improve</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {evaluation.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Criterion Breakdown (8 Criteria) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Detailed Rubric Breakdown ({evaluation.criteria.length} Dimensions)
          </h2>
          <span className="text-xs text-slate-400">Click cards to expand/collapse details</span>
        </div>

        <div className="space-y-3">
          {evaluation.criteria.map((crit) => (
            <CriterionCard key={crit.criterionKey} criterion={crit} />
          ))}
        </div>
      </div>

      {/* Submission Snapshot Collapsible */}
      {attempt.submission && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSubmissionSnapshot(!showSubmissionSnapshot)}
            className="w-full px-5 py-3 flex items-center justify-between text-left text-xs font-mono text-slate-300 hover:bg-slate-850/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              Inspect Evaluated Submission Snapshot
            </span>
            {showSubmissionSnapshot ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showSubmissionSnapshot && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/80 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto space-y-4">
              <div>
                <span className="text-blue-400 font-bold block mb-1">// Classes Modeled:</span>
                <pre className="text-[11px] whitespace-pre-wrap text-slate-400">
                  {JSON.stringify(attempt.submission.content.classes, null, 2)}
                </pre>
              </div>

              {attempt.submission.content.interfaces.length > 0 && (
                <div>
                  <span className="text-purple-400 font-bold block mb-1">// Interfaces:</span>
                  <pre className="text-[11px] whitespace-pre-wrap text-slate-400">
                    {JSON.stringify(attempt.submission.content.interfaces, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-emerald-400 font-bold block mb-1">// Explanation:</span>
                <p className="text-slate-300 whitespace-pre-wrap">
                  {attempt.submission.content.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/attempts"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <History className="w-4 h-4" />
          View All Attempts Across Problems
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            Practice Another Problem
          </Link>

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {retrying ? "Creating Next Attempt..." : "Retry Problem (Iterate)"}
          </button>
        </div>
      </div>
    </div>
  );
}
