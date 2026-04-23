'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  type: string;
  status: string;
  content: string;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
}

interface NotificationEmail {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [activeSection, setActiveSection] = useState<'submissions' | 'notifications'>('submissions');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchSubmissions();
    fetchNotifications();
  }, [router]);

  useEffect(() => {
    if (activeSection === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, activeSection]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token || '',
    };
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
      } else {
        setError(data.message || 'Failed to fetch submissions');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(prev =>
          prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
        );
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(prev => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedSubmission || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedSubmission.id}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSubmission(prev =>
          prev
            ? {
                ...prev,
                replies: [...prev.replies, data.data],
              }
            : null
        );
        setReplyContent('');
      }
    } catch {
      setError('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    setAddingEmail(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => [...prev, data.data]);
        setNewEmail('');
      }
    } catch {
      // ignore
    } finally {
      setAddingEmail(false);
    }
  };

  const handleDeleteEmail = async (email: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.filter(n => n.email !== email));
      }
    } catch {
      // ignore
    }
  };

  const pendingSubmissions = submissions.filter(
    s => s.status === 'pending' || s.status === 'reviewing'
  );
  const resolvedSubmissions = submissions.filter(s => s.status === 'resolved');
  const displayedSubmissions =
    activeTab === 'pending' ? pendingSubmissions : resolvedSubmissions;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      reviewing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      resolved: 'bg-green-500/10 text-[var(--success)] border border-green-500/20',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-12 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="pointer-events-auto transition-transform hover:scale-105">
            <div className="h-12 sm:h-16 w-auto">
              <img src="/logo.png" alt="AIRIS Logo" className="h-full w-auto object-contain" />
            </div>
          </a>
          <button
            onClick={handleLogout}
            className="pointer-events-auto text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-[var(--border)] pb-4">
            <button
              onClick={() => setActiveSection('submissions')}
              className={`text-xs font-black uppercase tracking-[0.3em] transition-all relative py-2 ${
                activeSection === 'submissions'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              / Submissions
              {activeSection === 'submissions' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('notifications')}
              className={`text-xs font-black uppercase tracking-[0.3em] transition-all relative py-2 ${
                activeSection === 'notifications'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              / Notifications
              {activeSection === 'notifications' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)]"></span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button
              onClick={() => setError('')}
              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {activeSection === 'submissions' && (
          <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${
                  activeTab === 'pending'
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] neon-glow'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--border)] hover:bg-[var(--secondary)]'
                }`}
              >
                Pending ({pendingSubmissions.length})
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${
                  activeTab === 'resolved'
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] neon-glow'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--border)] hover:bg-[var(--secondary)]'
                }`}
              >
                Resolved ({resolvedSubmissions.length})
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
              </div>
            ) : displayedSubmissions.length === 0 ? (
              <div className="text-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)] border-dashed">
                <p className="text-[var(--text-muted)] font-medium">
                  No {activeTab === 'pending' ? 'pending' : 'resolved'} submissions found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {displayedSubmissions.map(submission => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--primary)] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[var(--primary)] to-transparent opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest">
                            #{submission.id.slice(0, 8)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                            {submission.type}
                          </span>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-[var(--text)] font-medium line-clamp-2">
                          {submission.content}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter whitespace-nowrap pt-1 sm:pt-1.5">
                        {formatDate(submission.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'notifications' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-24 h-24 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-[var(--text)] uppercase tracking-tighter mb-6">
                Add Notification Email
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="admin@club.secure"
                  className="flex-1 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-black/40 text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                />
                <button
                  onClick={handleAddEmail}
                  disabled={addingEmail || !newEmail.includes('@')}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed neon-glow"
                >
                  {addingEmail ? '...' : 'Add'}
                </button>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-[var(--secondary)]/50 border-b border-[var(--border)]">
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        Email Address
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        Date Added
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {notifications.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-[var(--text-muted)] font-medium italic"
                        >
                          No notification emails configured.
                        </td>
                      </tr>
                    ) : (
                      notifications.map(notification => (
                        <tr
                          key={notification.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-[var(--text)] font-bold">
                            {notification.email}
                          </td>
                          <td className="px-6 py-4 text-xs text-[var(--text-muted)] font-medium">
                            {formatDate(notification.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteEmail(notification.email)}
                              className="text-red-500 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center backdrop-blur-sm z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-[var(--border)] relative mt-8 sm:mt-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--background)]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest block mb-1">
                  Submission ID: {selectedSubmission.id}
                </span>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                    {selectedSubmission.type}
                  </span>
                  {getStatusBadge(selectedSubmission.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--secondary)] rounded-xl transition-all border border-transparent hover:border-[var(--border)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">
                  Original Content
                </h3>
                <div className="p-4 sm:p-6 bg-black/40 rounded-2xl border border-[var(--border)] text-[var(--text)] whitespace-pre-wrap text-sm leading-relaxed font-medium shadow-inner break-words">
                  {selectedSubmission.content}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submitted: {formatDate(selectedSubmission.createdAt)}
                </div>
              </div>

              {selectedSubmission.replies.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">
                    Communication Log ({selectedSubmission.replies.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedSubmission.replies.map(reply => (
                      <div
                        key={reply.id}
                        className="p-5 bg-[var(--secondary)]/40 rounded-2xl border border-[var(--border)] relative break-words"
                      >
                        <div className="absolute top-4 right-4 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-50">
                          {formatDate(reply.createdAt)}
                        </div>
                        <p className="text-[var(--text)] whitespace-pre-wrap text-sm font-medium leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">
                  Response Action
                </h3>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Type your secure response to the member..."
                  rows={4}
                  className="w-full px-4 sm:px-5 py-4 rounded-xl border border-[var(--border)] bg-black/40 text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none text-sm transition-all"
                />
                <button
                  onClick={handleReplySubmit}
                  disabled={submittingReply || !replyContent.trim()}
                  className="mt-4 w-full sm:w-auto px-6 py-3.5 bg-[var(--primary)] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed neon-glow flex items-center justify-center gap-2"
                >
                  {submittingReply ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SENDING...
                    </>
                  ) : 'DISPATCH RESPONSE'}
                </button>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">
                  Workflow Status
                </h3>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {selectedSubmission.status !== 'reviewing' && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedSubmission.id, 'reviewing')
                      }
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      Mark Reviewing
                    </button>
                  )}
                  {selectedSubmission.status !== 'resolved' && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedSubmission.id, 'resolved')
                      }
                      className="w-full sm:w-auto px-5 py-2.5 bg-green-500/10 text-[var(--success)] border border-green-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full"></div>
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}