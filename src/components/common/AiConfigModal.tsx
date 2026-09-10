"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  RotateCw,
  AlertCircle,
  Key,
  ShieldCheck,
  Cpu,
} from "lucide-react";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange?: (hasKey: boolean) => void;
}

export default function AiConfigModal({
  isOpen,
  onClose,
  onKeyChange,
}: AiConfigModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [serverConfigured, setServerConfigured] = useState(false);
  const [serverModel, setServerModel] = useState("gemini-2.5-flash");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lld_gemini_api_key") || "";
      setApiKey(stored);
    }

    async function checkServerStatus() {
      try {
        const res = await fetch("/api/ai/status");
        const json = await res.json();
        if (json.success) {
          setServerConfigured(json.hasServerKey);
          if (json.model) setServerModel(json.model);
        }
      } catch (err) {
        console.error("Failed to check AI status:", err);
      }
    }
    checkServerStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest && !serverConfigured) {
      setTestResult({
        success: false,
        message: "Please enter a Gemini API Key to test.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({ success: true, message: json.message });
      } else {
        setTestResult({
          success: false,
          message: json.error || "Connection failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Network test error: " + err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("lld_gemini_api_key", trimmed);
      } else {
        localStorage.removeItem("lld_gemini_api_key");
      }
    }
    setSavedSuccess(true);
    if (onKeyChange) onKeyChange(Boolean(trimmed || serverConfigured));
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setApiKey("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("lld_gemini_api_key");
    }
    setTestResult(null);
    if (onKeyChange) onKeyChange(serverConfigured);
  };

  const isLive = Boolean(apiKey.trim() || serverConfigured);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Evaluator Settings
              </h2>
              <p className="text-xs text-slate-400">
                Google Gemini 2.5 Flash live architectural evaluation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Badge */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isLive
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              : "bg-slate-950/60 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              {isLive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              )}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">
                {isLive ? "Real AI Evaluation Active" : "Demo Mode Active"}
              </p>
              <p className="text-[11px] text-slate-400">
                {serverConfigured
                  ? `Server configured with ${serverModel}`
                  : apiKey.trim()
                  ? "Active via browser key"
                  : "Using deterministic MockEvaluator"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>{serverModel}</span>
          </div>
        </div>

        {/* Key Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Gemini API Key</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Get free key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder={
                serverConfigured
                  ? "Configured on server (override optional)"
                  : "AIzaSy..."
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your key is stored locally in your browser and used only for evaluation calls.
            For Vercel or cloud deployments, you can also set{" "}
            <code className="px-1 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[10px]">
              GEMINI_API_KEY
            </code>{" "}
            in your Vercel Project Environment Variables.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
              testResult.success
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-red-950/40 border-red-500/30 text-red-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="break-words leading-relaxed">{testResult.message}</div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing}
            className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all ${
                savedSuccess
                  ? "bg-emerald-600"
                  : "bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20"
              }`}
            >
              {savedSuccess ? "Saved!" : "Save & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
