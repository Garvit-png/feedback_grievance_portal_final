"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormMode = "none" | "grievance" | "feedback";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>("none");
  const [content, setContent] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, content }),
      });

      const data = await res.json();

      if (data.success) {
        setTrackingId(data.trackingId);
        setSuccess(true);
        setContent("");
      } else {
        setError(data.error || "Failed to submit");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("trackingId") as string;
    if (id.trim()) {
      router.push(`/check?id=${encodeURIComponent(id.trim())}`);
    }
  };

  const resetForm = () => {
    setMode("none");
    setContent("");
    setSuccess(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 flex flex-col items-center justify-center relative overflow-hidden">
      <header className="fixed top-0 left-0 p-4 sm:p-8 md:p-12 z-40">
        <div className="h-10 sm:h-12 md:h-16 w-auto">
          <img src="/logo.png" alt="AIRIS Logo" className="h-full w-auto object-contain" />
        </div>
      </header>
      <main className="w-full max-w-4xl">
        {success ? (
          <div className="max-w-xl mx-auto bg-[var(--surface)] rounded-xl p-6 sm:p-10 shadow-2xl border border-[var(--border)] relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"></div>
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text)] mb-3 tracking-tight uppercase">
              Received
            </h2>
            <p className="text-[var(--text-muted)] mb-10 text-base sm:text-lg">
              Your {mode === 'grievance' ? 'grievance' : 'feedback'} has been submitted securely and anonymously.
            </p>
            <div className="bg-[var(--secondary)] rounded-xl p-5 sm:p-8 mb-10 inline-block border border-[var(--border)] shadow-inner max-w-full">
              <p className="text-sm uppercase tracking-[0.3em] font-black text-[var(--text-muted)] mb-3">
                Reference Tracking ID
              </p>
              <p className="text-2xl sm:text-4xl font-mono font-black text-[var(--primary)] tracking-[0.2em] sm:tracking-widest break-all">
                {trackingId}
              </p>
            </div>
            <p className="text-sm sm:text-base text-[var(--text-muted)] mb-10 max-w-sm mx-auto leading-relaxed">
              Please save this tracking ID. You will need it to check the status of your submission later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetForm}
                className="h-14 px-8 bg-[var(--primary)] text-black rounded-lg font-black hover:bg-[var(--primary-hover)] transition-all neon-glow flex-1 sm:flex-none uppercase text-sm tracking-[0.2em]"
              >
                Submit Another
              </button>
              <button
                onClick={() => router.push(`/check?id=${trackingId}`)}
                className="h-14 px-8 border border-[var(--border)] text-[var(--text)] rounded-lg font-black hover:bg-[var(--secondary)] transition-all flex-1 sm:flex-none uppercase text-sm tracking-[0.2em]"
              >
                Check Status
              </button>
            </div>
          </div>
        ) : mode === "none" ? (
          <div className="w-full text-center px-1 sm:px-0">
            <div className="mb-10 sm:mb-14 max-w-[16rem] sm:max-w-none mx-auto">
              <h1 className="text-[2rem] sm:text-5xl font-black text-[var(--text)] mb-4 tracking-[-0.04em] leading-[0.92] sm:leading-none whitespace-normal text-balance break-words">
                <span className="block sm:inline">GRIEVANCE &</span>{" "}
                <span className="block sm:inline text-[var(--primary)]">FEEDBACK</span>
              </h1>
              <p className="text-[9px] sm:text-sm text-[var(--text-muted)] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] opacity-80 px-2 sm:px-0">
                Secure Anonymous Portal / AIRIS
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto px-0 sm:px-0">
              <button
                onClick={() => setMode("grievance")}
                className="w-full min-h-20 sm:h-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 sm:px-10 py-5 sm:py-0 bg-transparent border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] group"
              >
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    Submit Grievance
                  </h2>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] group-hover:text-white/70 font-bold uppercase tracking-widest mt-1">
                    Serious concerns & incidents
                  </p>
                </div>
                <span className="text-2xl font-light opacity-30 group-hover:opacity-100 self-end sm:self-auto">&rarr;</span>
              </button>

              <button
                onClick={() => setMode("feedback")}
                className="w-full min-h-20 sm:h-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 sm:px-10 py-5 sm:py-0 bg-transparent border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] group"
              >
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    Share Feedback
                  </h2>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] group-hover:text-white/70 font-bold uppercase tracking-widest mt-1">
                    Suggestions & thoughts
                  </p>
                </div>
                <span className="text-2xl font-light opacity-30 group-hover:opacity-100 self-end sm:self-auto">&rarr;</span>
              </button>

              <button
                onClick={() => router.push("/check")}
                className="w-full min-h-20 sm:h-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 sm:px-10 py-5 sm:py-0 bg-transparent border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] group"
              >
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    Check Status
                  </h2>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] group-hover:text-white/70 font-bold uppercase tracking-widest mt-1">
                    Track existing submissions
                  </p>
                </div>
                <span className="text-2xl font-light opacity-30 group-hover:opacity-100 self-end sm:self-auto">&rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-mono text-sm mb-8 uppercase tracking-[0.3em]"
            >
              <span>&lt;</span> BACK
            </button>

            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-black text-[var(--text)] uppercase tracking-tight mb-1">
                SUBMIT
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-mono tracking-wide">
                Total anonymity guaranteed.
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMode("grievance")}
                className={`flex-1 h-12 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] border ${
                  mode === "grievance"
                    ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                    : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--secondary)]"
                }`}
              >
                GRIEVANCE
              </button>
              <button
                onClick={() => setMode("feedback")}
                className={`flex-1 h-12 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] border ${
                  mode === "feedback"
                    ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                    : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--secondary)]"
                }`}
              >
                FEEDBACK
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="TYPE HERE ..."
                  className="w-full h-56 sm:h-64 px-5 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-8 bg-[#0a0a0a] text-[var(--text)] placeholder-[#222] focus:outline-none border border-[var(--border)] focus:border-[var(--primary)] transition-all text-base sm:text-lg font-mono leading-relaxed resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(255,0,127,0.05)] rounded-sm"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full mt-6 h-14 bg-[#700a39] text-[rgba(255,255,255,0.7)] hover:bg-[#850c44] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center"
              >
                {loading ? "PROCESSING ..." : "SECURE SUBMIT"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}