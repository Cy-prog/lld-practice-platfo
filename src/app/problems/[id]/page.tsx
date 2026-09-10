"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  RotateCw,
  Sparkles,
  Layers,
} from "lucide-react";
import { DifficultyBadge } from "@/components/common/Badges";
import { Problem } from "@/domain/models/Problem";

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProblemData() {
      try {
        const [probRes, attRes] = await Promise.all([
          fetch(`/api/problems/${problemId}`),
          fetch(`/api/attempts?problemId=${problemId}`),
        ]);

        const probJson = await probRes.json();
        if (probJson.success) {
          setProblem(probJson.data);
        }

        const attJson = await attRes.json();
        if (attJson.success && attJson.data.length > 0) {
          // Check if there's an in-progress or recent draft
          const inProgress = attJson.data.find(
            (a: any) => a.status === "DRAFT" || a.status === "SUBMITTED" || a.status === "EVALUATING"
          );
          if (inProgress) {
            setActiveAttemptId(inProgress.id);
          }
        }
      } catch (err) {
        console.error("Failed to load problem detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProblemData();
  }, [problemId]);

  const handleStartPractice = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/attempts/${json.data.id}`);
      } else {
        alert(json.error || "Failed to start practice attempt.");
      }
    } catch (err: any) {
      alert("Error starting attempt: " + err.message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading problem requirements...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Problem not found</h2>
        <Link href="/problems" className="text-sm text-blue-400 hover:underline">
          Return to problem library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Estimated: {problem.estimatedTimeMinutes} min
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">{problem.title}</h1>
        <p className="text-base text-slate-300 leading-relaxed">{problem.statement}</p>

        <div className="pt-2 flex items-center gap-3">
          {activeAttemptId ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/attempts/${activeAttemptId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                <RotateCw className="w-4 h-4" />
                Resume In-Progress Attempt
              </Link>
              <button
                type="button"
                onClick={handleStartPractice}
                disabled={starting}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-all"
              >
                {starting ? "Starting..." : "Start Fresh Attempt"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartPractice}
              disabled={starting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              {starting ? "Initializing Attempt..." : "Start Practice"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Functional Requirements */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h2>Functional Requirements</h2>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2.5">
          {problem.functionalRequirements.map((req, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="text-xs font-mono text-emerald-400 mt-0.5">{i + 1}.</span>
              <span className="leading-relaxed">{req}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Business Rules & Constraints */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2>Business Rules</h2>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 text-sm text-slate-300 h-full">
            {problem.businessRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 text-xs mt-1">•</span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2>Constraints</h2>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 text-sm text-slate-300 h-full">
            {problem.constraints.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-rose-400 text-xs mt-1">•</span>
                <span className="leading-relaxed">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assumptions & Unspecified Scenarios */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h2>Acceptable Design Assumptions</h2>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 text-sm text-slate-300">
          <p className="text-xs text-slate-400 mb-2">
            The following items are intentionally open-ended. You may state your assumptions around these in your submission:
          </p>
          {problem.assumptions.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-400 text-xs mt-1">•</span>
              <span className="leading-relaxed">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What Your Submission Should Cover */}
      <section className="p-6 rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/20 to-slate-900/70 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2>What Your Submission Should Cover</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">1. Identify Core Entities</span>
            State clear single responsibilities, attributes, and public operations.
          </div>
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">2. Interfaces & Contracts</span>
            Define abstractions for variable algorithms (e.g. Strategy, State).
          </div>
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">3. Structural Relationships</span>
            Distinguish composition (ownership) from aggregation or dependency.
          </div>
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">4. Workflows & Trade-offs</span>
            Map out the end-to-end execution path and justify architectural decisions.
          </div>
        </div>

        {problem.hints.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Architectural Hints (Optional)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 pl-1">
              {problem.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleStartPractice}
            disabled={starting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            {starting ? "Starting Attempt..." : "Start Practice Workspace"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
