"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Reply {
  content: string;
  createdAt: string;
}

interface SubmissionData {
  type: string;
  status: string;
  content: string;
  createdAt: string;
  replies: Reply[];
}

function CheckStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id") || "";

  const [trackingId, setTrackingId] = useState(initialId);
  const [data, setData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialId) {
      fetchSubmission(initialId);
    }
  }, [initialId]);

  const fetchSubmission = async (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/submission/${encodeURIComponent(id.trim())}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Submission not found");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchSubmission(trackingId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/10 text-[var(--success)] border border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 relative">
      <header className="fixed top-0 left-0 p-8 z-40 hidden md:block">
        <div className="h-12 w-auto">
          <img src="/logo.png" alt="AIRIS Logo" className="h-full w-auto object-contain" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto pt-14 md:pt-0">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <div className="bg-[var(--surface)] rounded-xl p-6 shadow-sm border border-[var(--border)] mb-6">
          <h1 className="text-xl font-semibold text-[var(--text)] mb-5">
            Check Status
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking ID"
              className="flex-1 w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-black/40 text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg font-bold hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 neon-glow uppercase text-xs tracking-widest"
            >
              {loading ? "..." : "Check"}
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-500 font-bold mb-1">ID Not Found</p>
            <p className="text-[var(--text-muted)] text-sm">
              We couldn&apos;t find any submission matching this ID. Please check and try again.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 shadow-sm border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <span className="text-sm text-[var(--text-muted)]">
                  {data.type === "grievance" ? "Grievance" : "Feedback"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    data.status
                  )}`}
                >
                  {data.status === "in_progress"
                    ? "In Progress"
                    : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </span>
              </div>

              <h2 className="text-base font-medium text-[var(--text)] mb-2">
                {data.type === "grievance" ? "Grievance Details" : "Feedback"}
              </h2>
              <p className="text-[var(--text-muted)] whitespace-pre-wrap">
                {data.content}
              </p>

              <p className="text-sm text-[var(--text-muted)] mt-4">
                Submitted: {formatDate(data.createdAt)}
              </p>
            </div>

            {data.replies && data.replies.length > 0 && (
              <div className="bg-[var(--surface)] rounded-xl p-5 shadow-sm border border-[var(--border)]">
                <h3 className="text-base font-medium text-[var(--text)] mb-4">
                  Replies ({data.replies.length})
                </h3>
                <div className="space-y-3">
                  {data.replies.map((reply, index) => (
                    <div
                      key={index}
                      className="bg-[var(--secondary)] rounded-lg p-4"
                    >
                      <p className="text-[var(--text)] whitespace-pre-wrap">
                        {reply.content}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        {formatDate(reply.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8">
      <main className="max-w-2xl mx-auto">
        <div className="bg-[var(--surface)] rounded-xl p-6 shadow-sm border border-[var(--border)] mb-6">
          <h1 className="text-xl font-semibold text-[var(--text)] mb-6">
            Check Status
          </h1>
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckStatus() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckStatusContent />
    </Suspense>
  );
}