"use client";

import { useEffect, useState, useTransition } from "react";
import { DEFAULT_QUESTIONS, Question, Session } from "@/lib/types";

type View = "auth" | "dashboard";

export default function AdminPanel() {
  const [view, setView] = useState<View>("auth");
  const [secret, setSecret] = useState("");
  const [authError, setAuthError] = useState("");

  // Try to verify secret by hitting the session endpoint
  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) return;
    // We verify by attempting to POST a dry-run; instead just store and show dashboard
    // Real verification happens on first API call
    setAuthError("");
    setView("dashboard");
  }

  if (view === "auth") {
    return (
      <div className="bg-surface-bright shadow-soft rounded-3xl p-8 space-y-6">
        <p className="text-lg font-bold text-ink">Enter admin secret</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full bg-surface border-2 border-outline rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
          />
          {authError && <p className="text-error text-sm">{authError}</p>}
          <button
            type="submit"
            className="w-full py-3 btn-chunky rounded-full bg-primary text-on-primary font-bold hover:opacity-90 transition"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return <Dashboard secret={secret} />;
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
function Dashboard({ secret }: { secret: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presenterToken, setPresenterToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  };

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function loadSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session");
      const data = await res.json();
      setSession(data.session ?? null);
      if (data.session) setQuestions(data.session.questions);
    } catch {
      setError("Failed to load session.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  function createSession() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/session", {
        method: "POST",
        headers,
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSession(data.session);
      flash("New session created ✓");
    });
  }

  function saveQuestions() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/session", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSession(data.session);
      setEditingQuestions(false);
      flash("Questions updated ✓");
    });
  }

  function pickPresenter() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/admin/presenter", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPresenterToken(data.presenter_token);
    });
  }

  function resetSubmissions() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/admin/reset", { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResetConfirm(false);
      flash("Submissions cleared ✓");
    });
  }

  function updateQuestion(index: number, label: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, label } : q))
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (loading) {
    return (
      <div className="text-center py-16 text-[var(--muted)] animate-pulse">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-mint text-on-mint rounded-2xl p-4 text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {/* ── Current session status ── */}
      <Card title="Current session">
        {session ? (
          <div className="space-y-3">
            <Row label="Week" value={session.week_label} />
            <Row label="Status" value={session.is_active ? "🟢 Active" : "🔴 Inactive"} />
            <Row
              label="Closes at"
              value={new Date(session.closes_at).toLocaleString()}
            />
            <Row label="Session ID" value={<Code>{session.id}</Code>} />
          </div>
        ) : (
          <p className="text-[var(--muted)]">No active session.</p>
        )}
        <button
          onClick={createSession}
          disabled={isPending}
          className="mt-4 w-full py-3 btn-chunky rounded-full bg-primary text-on-primary font-bold hover:opacity-90 disabled:opacity-40 transition"
        >
          {session ? "Start new session (archives current)" : "Start first session"}
        </button>
      </Card>

      {/* ── Questions ── */}
      {session && (
        <Card title="Questions">
          {editingQuestions ? (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <input
                  key={q.id}
                  value={q.label}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  className="w-full bg-surface border-2 border-outline rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition text-sm"
                />
              ))}
              <div className="flex gap-3">
                <button
                  onClick={saveQuestions}
                  disabled={isPending}
                  className="flex-1 py-2.5 btn-chunky rounded-full bg-primary text-on-primary font-bold hover:opacity-90 disabled:opacity-40 transition text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingQuestions(false); setQuestions(session.questions); }}
                  className="flex-1 py-2.5 btn-chunky rounded-full bg-surface-container text-[var(--foreground)] font-semibold hover:opacity-90 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {session.questions.map((q, i) => (
                <p key={q.id} className="text-sm text-[var(--muted)]">
                  {i + 1}. {q.label}
                </p>
              ))}
              <button
                onClick={() => setEditingQuestions(true)}
                className="mt-3 text-sm text-[var(--accent)] underline hover:opacity-80 transition"
              >
                Edit questions
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ── Presenter ── */}
      {session && (
        <Card title="Presenter">
          <p className="text-sm text-[var(--muted)] mb-4">
            Pick the weekly presenter. Share their link before Friday.
          </p>
          <button
            onClick={pickPresenter}
            disabled={isPending}
            className="w-full py-3 btn-chunky rounded-full bg-surface-container text-[var(--foreground)] font-semibold hover:border-[var(--accent)] border border-[var(--card-border)] hover:border-opacity-100 disabled:opacity-40 transition"
          >
            🎲 Randomise presenter link
          </button>
          {presenterToken && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider">
                Presenter link
              </p>
              <div className="flex gap-2 items-center">
                <Code className="flex-1 truncate">
                  {origin}/present?token={presenterToken}
                </Code>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${origin}/present?token=${presenterToken}`
                    )
                  }
                  className="btn-chunky shrink-0 text-xs px-4 py-2 rounded-full bg-primary text-on-primary font-bold hover:opacity-90"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Danger zone ── */}
      {session && (
        <Card title="Danger zone">
          {resetConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-error">
                This permanently deletes all submissions for this session. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetSubmissions}
                  disabled={isPending}
                  className="btn-chunky flex-1 py-2.5 rounded-full bg-error text-white font-bold hover:opacity-90 disabled:opacity-40 text-sm"
                >
                  Yes, clear all
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="flex-1 py-2.5 btn-chunky rounded-full bg-surface-container font-semibold hover:opacity-90 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="btn-chunky w-full py-3 rounded-full border-2 border-error/40 text-error font-bold hover:bg-error-container transition text-sm"
            >
              Clear all submissions
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-bright shadow-soft rounded-3xl p-6 space-y-4">
      <h2 className="font-bold text-lg text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm gap-4">
      <span className="text-[var(--muted)] shrink-0">{label}</span>
      <span className="font-mono text-right truncate">{value}</span>
    </div>
  );
}

function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={`bg-surface-container rounded-lg px-2 py-1 text-xs font-mono ${className ?? ""}`}
    >
      {children}
    </code>
  );
}
