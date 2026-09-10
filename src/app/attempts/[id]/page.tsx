"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Send,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Maximize2,
} from "lucide-react";
import { Attempt } from "@/domain/models/Attempt";
import { Problem } from "@/domain/models/Problem";
import { StructuredTextSubmissionContent } from "@/domain/models/Submission";
import { ValidationResult } from "@/infrastructure/validation/DeterministicValidator";
import ClassesEditor from "@/components/workspace/ClassesEditor";
import InterfacesEditor from "@/components/workspace/InterfacesEditor";
import RelationshipsEditor from "@/components/workspace/RelationshipsEditor";
import WorkflowsEditor from "@/components/workspace/WorkflowsEditor";
import PatternsEditor from "@/components/workspace/PatternsEditor";
import ValidationAlert from "@/components/workspace/ValidationAlert";
import { StatusBadge } from "@/components/common/Badges";

export default function PracticeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "classes" | "interfaces" | "relationships" | "workflows" | "patterns" | "extensibility" | "explanation"
  >("classes");

  // Form state
  const [content, setContent] = useState<StructuredTextSubmissionContent>({
    assumptions: "",
    classes: [],
    interfaces: [],
    relationships: [],
    workflows: [],
    designPatterns: [],
    extensibility: "",
    edgeCases: "",
    explanation: "",
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAttemptData = useCallback(async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (json.success) {
        const att: Attempt = json.data;
        setAttempt(att);

        // Populate content from draft or submission
        if (att.submission) {
          setContent(att.submission.content);
        } else if (att.draftContent) {
          setContent(att.draftContent);
        }

        // Fetch problem details
        const probRes = await fetch(`/api/problems/${att.problemId}`);
        const probJson = await probRes.json();
        if (probJson.success) {
          setProblem(probJson.data);
        }

        // If completed, redirect to feedback
        if (att.status === "COMPLETED") {
          router.push(`/attempts/${attemptId}/feedback`);
        } else if (att.status === "EVALUATING") {
          setEvaluating(true);
        }
      }
    } catch (err) {
      console.error("Failed to load attempt:", err);
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    fetchAttemptData();
  }, [fetchAttemptData]);

  // Polling effect when evaluating
  useEffect(() => {
    if (evaluating) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/attempts/${attemptId}`);
          const json = await res.json();
          if (json.success && json.data.status === "COMPLETED") {
            clearInterval(pollIntervalRef.current!);
            router.push(`/attempts/${attemptId}/feedback`);
          } else if (json.success && json.data.status === "FAILED") {
            clearInterval(pollIntervalRef.current!);
            setEvaluating(false);
            setAttempt(json.data);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [evaluating, attemptId, router]);

  // Save draft
  const handleSaveDraft = async () => {
    if (!attempt || attempt.status !== "DRAFT") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setAttempt(json.data);
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Draft save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Submit and evaluate
  const handleSubmit = async () => {
    setSubmitting(true);
    setValidation(null);
    try {
      // 1. Submit attempt
      const submitRes = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const submitJson = await submitRes.json();

      if (!submitRes.ok || !submitJson.success) {
        if (submitJson.validation) {
          setValidation(submitJson.validation);
        } else {
          alert(submitJson.error || "Submission failed.");
        }
        setSubmitting(false);
        return;
      }

      setAttempt(submitJson.data.attempt);
      setEvaluating(true);

      // 2. Trigger evaluation asynchronously
      const evalRes = await fetch(`/api/attempts/${attemptId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const evalJson = await evalRes.json();
      if (evalJson.success) {
        router.push(`/attempts/${attemptId}/feedback`);
      } else {
        alert(evalJson.error || "Evaluation failed. You can retry evaluation without losing your design.");
        setEvaluating(false);
        await fetchAttemptData();
      }
    } catch (err: any) {
      alert("Error submitting attempt: " + err.message);
      setEvaluating(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Preparing design workspace...</p>
      </div>
    );
  }

  if (!attempt || !problem) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Attempt session not found</h2>
        <Link href="/problems" className="text-sm text-blue-400 hover:underline">
          Return to problem library
        </Link>
      </div>
    );
  }

  const isReadOnly = attempt.status !== "DRAFT";

  return (
    <div className="space-y-6 pb-20">
      {/* Workspace Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/80 sticky top-20 z-40 backdrop-blur-md shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/problems/${problem.id}`}
              className="text-slate-400 hover:text-white transition-colors"
              title="View Requirements"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {problem.title}
            </h1>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Attempt #{attempt.attemptNumber}
            </span>
            <StatusBadge status={attempt.status} />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>LLD Workspace</span>
            {lastSavedTime && (
              <span className="text-slate-500 font-mono text-[11px]">
                • Draft saved at {lastSavedTime}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || evaluating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Validating..." : evaluating ? "Evaluating..." : "Submit Design"}
              </button>
            </>
          )}

          {attempt.status === "COMPLETED" && (
            <Link
              href={`/attempts/${attempt.id}/feedback`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              View Evaluation Feedback
            </Link>
          )}
        </div>
      </div>

      {/* Evaluating Banner */}
      {evaluating && (
        <div className="p-6 rounded-xl border border-purple-800/80 bg-purple-950/30 text-purple-200 flex items-center gap-4 animate-pulse">
          <RotateCw className="w-6 h-6 text-purple-400 animate-spin shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Evaluation in progress...</h3>
            <p className="text-xs text-purple-300/80 mt-0.5">
              Evaluating your design against the 8-dimension rubric. Please wait a few seconds...
            </p>
          </div>
        </div>
      )}

      {/* Validation Feedback */}
      <ValidationAlert validation={validation} />

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1 text-xs">
        {[
          { id: "classes", label: `Classes (${content.classes.length})` },
          { id: "interfaces", label: `Interfaces (${content.interfaces.length})` },
          { id: "relationships", label: `Relationships (${content.relationships.length})` },
          { id: "workflows", label: `Workflows (${content.workflows.length})` },
          { id: "patterns", label: `Patterns (${content.designPatterns.length})` },
          { id: "extensibility", label: "Extensibility & Edge Cases" },
          { id: "explanation", label: "Trade-offs & Explanation *" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors border-b-2 -mb-1 ${
              activeTab === tab.id
                ? "bg-slate-900 text-blue-400 border-blue-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Editor Panel */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
        {activeTab === "classes" && (
          <ClassesEditor
            classes={content.classes}
            onChange={(classes) => setContent({ ...content, classes })}
          />
        )}

        {activeTab === "interfaces" && (
          <InterfacesEditor
            interfaces={content.interfaces}
            onChange={(interfaces) => setContent({ ...content, interfaces })}
          />
        )}

        {activeTab === "relationships" && (
          <RelationshipsEditor
            relationships={content.relationships}
            onChange={(relationships) => setContent({ ...content, relationships })}
          />
        )}

        {activeTab === "workflows" && (
          <WorkflowsEditor
            workflows={content.workflows}
            onChange={(workflows) => setContent({ ...content, workflows })}
          />
        )}

        {activeTab === "patterns" && (
          <PatternsEditor
            patterns={content.designPatterns}
            onChange={(designPatterns) => setContent({ ...content, designPatterns })}
          />
        )}

        {activeTab === "extensibility" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Extensibility & Edge Cases</h3>
              <p className="text-xs text-slate-400 mt-1">
                Demonstrate how your architecture responds to requirement evolution and handles boundary failures.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-slate-300">
                Extensibility / Handling Future Requirement Changes
              </label>
              <p className="text-[11px] text-slate-400">
                What would you change if the requirements evolved (e.g. dynamic surge pricing, autonomous shuttles, or multi-currency)?
              </p>
              <textarea
                rows={4}
                value={content.extensibility}
                onChange={(e) => setContent({ ...content, extensibility: e.target.value })}
                placeholder="Explain how polymorphism, interfaces, or factories allow adding new features without altering existing core classes (Open-Closed Principle)..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-slate-300">
                Edge Cases & Concurrency
              </label>
              <p className="text-[11px] text-slate-400">
                Identify failure modes (e.g. capacity exhausted, simultaneous double-booking, hardware failure, lost ticket).
              </p>
              <textarea
                rows={4}
                value={content.edgeCases}
                onChange={(e) => setContent({ ...content, edgeCases: e.target.value })}
                placeholder="How does your design address race conditions, resource contention, and invalid state transitions?..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeTab === "explanation" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Overall Architecture & Trade-offs</h3>
              <p className="text-xs text-slate-400 mt-1">
                Articulate WHY you made these architectural choices. Senior LLD evaluations prioritize trade-off reasoning over blind complexity.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-slate-300">
                Assumptions (Scoping & Boundaries)
              </label>
              <textarea
                rows={3}
                value={content.assumptions}
                onChange={(e) => setContent({ ...content, assumptions: e.target.value })}
                placeholder="State any explicit assumptions: e.g. 'Assumed single-level entry barrier, automated license plate cameras act as event producers, cash payments handled at exit booth'..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-slate-300">
                Overall Design Explanation & Trade-offs <span className="text-rose-400">*</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Explain your main architectural trade-offs: e.g. simplicity vs extensibility, memory caching vs transactional consistency, inheritance vs composition. (Minimum 20 characters)
              </p>
              <textarea
                rows={6}
                value={content.explanation}
                onChange={(e) => setContent({ ...content, explanation: e.target.value })}
                placeholder="Provide a free-form walkthrough of your design decisions, why responsibilities were distributed this way, and what alternatives you rejected..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Evidence-Based Design Submission</span>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || evaluating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Validating Invariants..." : "Submit for Evaluation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
