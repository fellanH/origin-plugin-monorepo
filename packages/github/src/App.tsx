import { useState, useEffect, useCallback } from "react";
import type { ReactElement } from "react";
import { usePluginContext } from "@origin-cards/sdk";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GithubUser {
  login: string;
  avatar_url: string;
}

interface GithubLabel {
  name: string;
  color: string;
}

interface PR {
  number: number;
  title: string;
  user: GithubUser;
  html_url: string;
  draft: boolean;
  created_at: string;
  labels: GithubLabel[];
}

interface Issue {
  number: number;
  title: string;
  user: GithubUser;
  html_url: string;
  created_at: string;
  labels: GithubLabel[];
  /** Present when the item is a PR — used to filter them out of the issues list. */
  pull_request?: unknown;
}

type Tab = "prs" | "issues";

// ─── Utilities ───────────────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function apiErrorMessage(status: number): string {
  if (status === 404)
    return "Repo not found or private. GitHub API requires the repo to be public.";
  if (status === 403)
    return "GitHub API rate limit reached. Try again in a few minutes.";
  return `GitHub API error (HTTP ${status})`;
}

function openUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

// ─── Label chip ──────────────────────────────────────────────────────────────

interface LabelChipProps {
  label: GithubLabel;
}

function LabelChip({ label }: LabelChipProps): ReactElement {
  return (
    <span
      className="rounded-full px-1.5 py-px text-xs"
      style={{
        backgroundColor: `#${label.color}33`,
        color: `#${label.color}`,
      }}
    >
      {label.name}
    </span>
  );
}

// ─── PR row ──────────────────────────────────────────────────────────────────

interface PRRowProps {
  pr: PR;
  isDark: boolean;
}

function PRRow({ pr, isDark }: PRRowProps): ReactElement {
  return (
    <button
      className={`w-full border-b px-3 py-2.5 text-left transition-colors ${
        isDark
          ? "border-zinc-700/50 hover:bg-zinc-800"
          : "border-zinc-100 hover:bg-zinc-50"
      }`}
      onClick={() => openUrl(pr.html_url)}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-xs leading-5">
          {pr.draft ? "⚫" : "🟢"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="shrink-0 text-xs opacity-40">#{pr.number}</span>
            <span className="truncate text-sm leading-5">{pr.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <img
              src={pr.user.avatar_url}
              alt={pr.user.login}
              className="h-4 w-4 rounded-full"
            />
            <span className="text-xs opacity-50">{pr.user.login}</span>
            <span className="text-xs opacity-30">·</span>
            <span className="text-xs opacity-50">
              {relativeTime(pr.created_at)}
            </span>
            {pr.labels.map((label) => (
              <LabelChip key={label.name} label={label} />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Issue row ───────────────────────────────────────────────────────────────

interface IssueRowProps {
  issue: Issue;
  isDark: boolean;
}

function IssueRow({ issue, isDark }: IssueRowProps): ReactElement {
  return (
    <button
      className={`w-full border-b px-3 py-2.5 text-left transition-colors ${
        isDark
          ? "border-zinc-700/50 hover:bg-zinc-800"
          : "border-zinc-100 hover:bg-zinc-50"
      }`}
      onClick={() => openUrl(issue.html_url)}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-xs leading-5 text-green-500">●</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="shrink-0 text-xs opacity-40">
              #{issue.number}
            </span>
            <span className="truncate text-sm leading-5">{issue.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <img
              src={issue.user.avatar_url}
              alt={issue.user.login}
              className="h-4 w-4 rounded-full"
            />
            <span className="text-xs opacity-50">{issue.user.login}</span>
            <span className="text-xs opacity-30">·</span>
            <span className="text-xs opacity-50">
              {relativeTime(issue.created_at)}
            </span>
            {issue.labels.map((label) => (
              <LabelChip key={label.name} label={label} />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function App(): ReactElement {
  const context = usePluginContext();

  // Derive owner/repo from persisted config (context.config is shallow-merged)
  const savedOwner = (context?.config.owner as string | undefined) ?? "";
  const savedRepo = (context?.config.repo as string | undefined) ?? "";

  const [ownerInput, setOwnerInput] = useState(savedOwner);
  const [repoInput, setRepoInput] = useState(savedRepo);
  const [configured, setConfigured] = useState(
    Boolean(savedOwner && savedRepo),
  );
  const [showSettings, setShowSettings] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("prs");
  const [prs, setPrs] = useState<PR[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const isDark = context?.theme === "dark";

  // Sync local input state when config changes externally (e.g. same card in
  // another workspace tab, or a future "duplicate panel" action).
  useEffect(() => {
    const o = (context?.config.owner as string | undefined) ?? "";
    const r = (context?.config.repo as string | undefined) ?? "";
    setOwnerInput(o);
    setRepoInput(r);
    setConfigured(Boolean(o && r));
  }, [context?.config.owner, context?.config.repo]);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchPRs = useCallback(async (o: string, r: string) => {
    const res = await fetch(
      `https://api.github.com/repos/${o}/${r}/pulls?state=open&per_page=30`,
    );
    if (!res.ok) throw new Error(apiErrorMessage(res.status));
    const data = (await res.json()) as PR[];
    setPrs(data);
  }, []);

  const fetchIssues = useCallback(async (o: string, r: string) => {
    const res = await fetch(
      `https://api.github.com/repos/${o}/${r}/issues?state=open&per_page=30`,
    );
    if (!res.ok) throw new Error(apiErrorMessage(res.status));
    const data = (await res.json()) as Issue[];
    // GitHub's issues endpoint includes PRs — filter them out
    setIssues(data.filter((item) => !item.pull_request));
  }, []);

  const fetchAll = useCallback(
    async (o: string, r: string) => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchPRs(o, r), fetchIssues(o, r)]);
        setLastFetched(Date.now());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load data from GitHub",
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchPRs, fetchIssues],
  );

  // Fetch on initial load if already configured
  useEffect(() => {
    if (savedOwner && savedRepo) {
      void fetchAll(savedOwner, savedRepo);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!configured || showSettings) return;
    const o = (context?.config.owner as string | undefined) ?? "";
    const r = (context?.config.repo as string | undefined) ?? "";
    if (!o || !r) return;
    const id = setInterval(() => void fetchAll(o, r), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [
    configured,
    showSettings,
    context?.config.owner,
    context?.config.repo,
    fetchAll,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    const o = ownerInput.trim();
    const r = repoInput.trim();
    if (!o || !r) return;
    // Persist to workspace store via context — shallow-merged into card config
    context?.setConfig({ owner: o, repo: r });
    setConfigured(true);
    setShowSettings(false);
    void fetchAll(o, r);
  }, [ownerInput, repoInput, fetchAll, context]);

  const handleDisconnect = useCallback(() => {
    context?.setConfig({ owner: "", repo: "" });
    setOwnerInput("");
    setRepoInput("");
    setConfigured(false);
    setPrs([]);
    setIssues([]);
    setError(null);
    setLastFetched(null);
  }, [context]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const owner = (context?.config.owner as string | undefined) ?? "";
  const repo = (context?.config.repo as string | undefined) ?? "";

  const minutesAgo =
    lastFetched !== null
      ? Math.floor((Date.now() - lastFetched) / 60000)
      : null;

  const inputClass = `rounded border px-3 py-2 text-sm outline-none focus:ring-1 ${
    isDark
      ? "border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:ring-zinc-400"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-400"
  }`;

  const borderClass = isDark ? "border-zinc-700" : "border-zinc-200";

  // Show loading state while waiting for context from host
  if (!context) {
    return (
      <div className="flex h-full items-center justify-center text-xs opacity-40">
        Connecting…
      </div>
    );
  }

  // ── Setup / settings screen ───────────────────────────────────────────────

  if (!configured || showSettings) {
    return (
      <div
        className={`flex h-full flex-col ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
      >
        {/* Settings sub-header when reconfiguring an already-configured repo */}
        {configured && showSettings && (
          <div
            className={`flex items-center gap-2 border-b px-3 py-2 ${borderClass}`}
          >
            <span className="flex-1 text-sm font-medium">Settings</span>
            <button
              className="text-xs opacity-50 hover:opacity-100"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="text-3xl">🐙</div>
          <h2 className="text-sm font-semibold">Connect a repository</h2>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Owner"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
            <input
              className={inputClass}
              placeholder="Repository"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
            <button
              className={`rounded py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                isDark
                  ? "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                  : "bg-zinc-900 text-white hover:bg-zinc-700"
              }`}
              onClick={handleConnect}
              disabled={loading || !ownerInput.trim() || !repoInput.trim()}
            >
              {loading ? "Connecting…" : "Connect"}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {configured && (
              <button
                className="mt-1 text-xs text-red-400 opacity-70 hover:opacity-100"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main view (tabbed: PRs | Issues) ─────────────────────────────────────

  return (
    <div
      className={`flex h-full flex-col ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 border-b px-3 py-2 ${borderClass}`}
      >
        <span className="flex-1 truncate text-sm font-medium">
          {owner}/{repo}
        </span>
        <button
          className="text-sm opacity-50 hover:opacity-100"
          onClick={() => void fetchAll(owner, repo)}
          title="Refresh"
        >
          ↻
        </button>
        <button
          className="text-sm opacity-50 hover:opacity-100"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Tab bar */}
      <div className={`flex border-b ${borderClass}`}>
        {(["prs", "issues"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? isDark
                  ? "border-b-2 border-zinc-300 text-zinc-100"
                  : "border-b-2 border-zinc-900 text-zinc-900"
                : "opacity-50 hover:opacity-80"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "prs" ? "Pull Requests" : "Issues"}
          </button>
        ))}
      </div>

      {/* Last fetched */}
      {minutesAgo !== null && (
        <div className="px-3 py-1 text-xs opacity-40">
          Updated {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm opacity-50">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="px-3 py-4 text-sm text-red-400">{error}</div>
        )}

        {!loading && !error && activeTab === "prs" && (
          <>
            {prs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm opacity-50">
                No open pull requests
              </div>
            ) : (
              prs.map((pr) => (
                <PRRow key={pr.number} pr={pr} isDark={isDark} />
              ))
            )}
          </>
        )}

        {!loading && !error && activeTab === "issues" && (
          <>
            {issues.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm opacity-50">
                No open issues
              </div>
            ) : (
              issues.map((issue) => (
                <IssueRow key={issue.number} issue={issue} isDark={isDark} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
