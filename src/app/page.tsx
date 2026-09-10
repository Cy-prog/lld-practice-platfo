"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  ArrowRight,
  BookOpen,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import { StatusBadge, ScorePill } from "@/components/common/Badges";

interface DashboardData {
  totalProblems: number;
  problemsPracticed: number;
  attemptsCompleted: number;
  averageScore: number;
  recentAttempts: Array<{
    id: string;
    problemId: string;
    problemTitle: string;
    attemptNumber: number;
    status: any;
    score: number | null;
    createdAt: string;
  }>;
  areasNeedingImprovement: Array<{
    key: string;
    name: string;
    averageScore: number;
  }>;
  continuePracticingAttemptId: string | null;
  continuePracticingProblemId: string | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading dashboard metrics...</p>
      </div>
    );
  }

  const {
    totalProblems = 5,
    problemsPracticed = 0,
    attemptsCompleted = 0,
    averageScore = 0,
    recentAttempts = [],
    areasNeedingImprovement = [],
    continuePracticingAttemptId,
    continuePracticingProblemId,
  } = data || {};

  return (
    <div className="space-y-10 pb-12">
      {/* Hero / Value Proposition Header */}
      <div className="p-8 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-blue-950/20 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LLD Engineering Practice</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Practice LLD. Get evidence-based feedback. Improve your next design.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Move beyond superficial AI scores. Submit structured domain architectures, validate
            invariants deterministically, and receive explainable rubric evaluations with concrete
            evidence and actionable recommendations.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {continuePracticingAttemptId ? (
              <Link
                href={`/attempts/${continuePracticingAttemptId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-500/20"
              >
                <RotateCw className="w-4 h-4" />
                Resume In-Progress Attempt
              </Link>
            ) : continuePracticingProblemId ? (
              <Link
                href={`/problems/${continuePracticingProblemId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-500/20"
              >
                <BookOpen className="w-4 h-4" />
                Start Recommended Practice
              </Link>
            ) : (
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-500/20"
              >
                Explore Problem Library
              </Link>
            )}

            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
            >
              Browse All Problems
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Problems Practiced</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {problemsPracticed} <span className="text-sm text-slate-500 font-normal">/ {totalProblems}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Completed Attempts</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {attemptsCompleted}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Average Rubric Score</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {averageScore > 0 ? `${averageScore}` : "—"}{" "}
              {averageScore > 0 && <span className="text-sm text-slate-500 font-normal">/ 100</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Evaluation Engine</span>
            <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Rubric-Based
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs">
            LLD
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">Recent Attempts</h2>
            <Link
              href="/attempts"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="p-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
              <Code className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Your first LLD attempt starts here.</h3>
                <p className="text-xs text-slate-400">
                  Select an industry-standard problem to design class models and test your architecture.
                </p>
              </div>
              <Link
                href="/problems"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all"
              >
                Choose a Problem
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800/60">
              {recentAttempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          att.status === "COMPLETED"
                            ? `/attempts/${att.id}/feedback`
                            : `/attempts/${att.id}`
                        }
                        className="font-medium text-sm text-white hover:text-blue-400 transition-colors"
                      >
                        {att.problemTitle}
                      </Link>
                      <span className="text-xs font-mono text-slate-500">
                        (Attempt #{att.attemptNumber})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <StatusBadge status={att.status} />
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(att.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ScorePill score={att.score} />
                    <Link
                      href={
                        att.status === "COMPLETED"
                          ? `/attempts/${att.id}/feedback`
                          : `/attempts/${att.id}`
                      }
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      {att.status === "COMPLETED" ? "Review" : "Continue"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Focus Areas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white tracking-tight">Areas Needing Practice</h2>

          {areasNeedingImprovement.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <h3 className="text-xs font-medium text-white">No Critical Deficits</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Complete more attempts to identify targeted weaknesses across the 8 rubric dimensions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {areasNeedingImprovement.map((area) => (
                <div
                  key={area.key}
                  className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{area.name}</span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      Avg: {area.averageScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recurring score under 75. Prioritize separation of concerns and interface contracts on future designs.
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 space-y-2">
            <h4 className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              The LLD Practice Philosophy
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Design is an iterative process. Avoid looking for a single &quot;correct answer&quot;. Focus on justifying your trade-offs, decoupling state, and protecting domain boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
