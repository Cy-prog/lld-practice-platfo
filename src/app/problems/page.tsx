"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Search, Filter, RotateCw } from "lucide-react";
import ProblemCard from "@/components/problem/ProblemCard";
import { ProblemWithStats } from "@/application/services/ProblemService";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchProblems() {
      try {
        const res = await fetch("/api/problems");
        const json = await res.json();
        if (json.success) {
          setProblems(json.data);
        }
      } catch (err) {
        console.error("Failed to load problems:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDifficulty =
      difficultyFilter === "ALL" || p.difficulty === difficultyFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "NOT_STARTED" && p.status === "NOT_STARTED") ||
      (statusFilter === "IN_PROGRESS" && p.status === "IN_PROGRESS") ||
      (statusFilter === "COMPLETED" && (p.status === "COMPLETED" || p.status === "NEEDS_IMPROVEMENT"));

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-mono">
          <BookOpen className="w-4 h-4" />
          <span>Curated Problem Library</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Low-Level Design Problems
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Choose a realistic scenario, analyze functional requirements and business rules, and construct an object-oriented domain architecture.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search problems, patterns, or tags..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading problem library...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <p className="text-sm text-slate-400">No practice problems match your selected filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setDifficultyFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
}
