import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function RevaluationManagerModal({
  isOpen,
  onClose,
  currentCourse,
  currentUser,
  onResolved,
  showToast
}) {
  const [revaluations, setRevaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'resolved'

  // Resolution Form state
  const [selectedReval, setSelectedReval] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('approved');
  const [adjustedMarks, setAdjustedMarks] = useState('');
  const [facultyResponse, setFacultyResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentCourse?.id) {
      fetchRevaluations(currentCourse.id);
    }
  }, [isOpen, currentCourse?.id]);

  const fetchRevaluations = async (crsId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${crsId}/revaluations`);
      if (!res.ok) throw new Error('Failed to load grievances');
      const data = await res.json();
      setRevaluations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (reval, status) => {
    setSelectedReval(reval);
    setResolutionStatus(status);
    setAdjustedMarks(status === 'approved' ? reval.expected_marks || reval.current_marks : reval.current_marks);
    setFacultyResponse(status === 'approved' ? 'Verified answer sheet; calculation error corrected.' : 'Answer evaluated per grading scheme; marks upheld.');
  };

  const executeResolution = async () => {
    if (!selectedReval) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/revaluations/${selectedReval.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionStatus,
          faculty_response: facultyResponse,
          adjusted_marks: resolutionStatus === 'approved' ? parseFloat(adjustedMarks) : null,
          resolved_by_id: currentUser?.id || 'usr-fac-1',
          resolved_by_name: currentUser?.name || 'Dr. Snehlata Wankhade',
          resolved_by_role: currentUser?.role || 'faculty'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Resolution failed');
      }

      if (showToast) {
        showToast(
          `Grievance for ${selectedReval.student_name} ${resolutionStatus === 'approved' ? 'Approved & Score Updated' : 'Rejected'}!`,
          'success'
        );
      }
      setSelectedReval(null);
      fetchRevaluations(currentCourse.id);
      if (onResolved) onResolved();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const pendingList = revaluations.filter((r) => r.status === 'pending');
  const resolvedList = revaluations.filter((r) => r.status !== 'pending');
  const currentList = activeTab === 'pending' ? pendingList : resolvedList;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <AlertCircle size={20} style={{ color: 'var(--amber)' }} />
            Student Revaluation & Grievance Manager
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sub Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Reviews ({pendingList.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'resolved' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved History ({resolvedList.length})
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading grievances...
            </div>
          ) : currentList.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No {activeTab} grievance requests found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {currentList.map((rev) => (
                <div
                  key={rev.id}
                  className="card"
                  style={{
                    padding: '1rem 1.25rem',
                    borderLeft: `4px solid ${
                      rev.status === 'pending'
                        ? 'var(--amber)'
                        : rev.status === 'approved'
                        ? 'var(--emerald)'
                        : 'var(--rose)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rev.student_name}</span>
                      <span className="badge badge-slate" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        {rev.roll_number}
                      </span>
                      <span className="badge badge-blue">{rev.component_name}</span>
                    </div>

                    <span
                      className={`badge ${
                        rev.status === 'pending'
                          ? 'badge-amber'
                          : rev.status === 'approved'
                          ? 'badge-emerald'
                          : 'badge-rose'
                      }`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Current Award: <strong>{rev.current_marks}</strong> &rarr; Expected Claim: <strong>{rev.expected_marks}</strong>
                    {rev.adjusted_marks !== null && (
                      <span style={{ marginLeft: '0.75rem', color: 'var(--emerald)', fontWeight: 700 }}>
                        Awarded: {rev.adjusted_marks} Marks
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Student Grievance:</strong> &ldquo;{rev.reason}&rdquo;
                  </div>

                  {rev.faculty_response && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <strong>Faculty Response:</strong> {rev.faculty_response}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                        Resolved by {rev.resolved_by_name} ({rev.resolved_at || 'Recent'})
                      </div>
                    </div>
                  )}

                  {rev.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        className="btn btn-emerald btn-xs"
                        onClick={() => handleOpenResolve(rev, 'approved')}
                      >
                        <CheckCircle2 size={13} /> Approve & Adjust
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleOpenResolve(rev, 'rejected')}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline Resolution Box */}
          {selectedReval && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Resolve Request for {selectedReval.student_name} ({selectedReval.component_name})
              </div>

              {resolutionStatus === 'approved' && (
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="label">Adjusted Marks Awarded:</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    value={adjustedMarks}
                    onChange={(e) => setAdjustedMarks(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="label">Official Response to Student:</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={facultyResponse}
                  onChange={(e) => setFacultyResponse(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReval(null)}>
                  Cancel
                </button>
                <button
                  className={`btn btn-sm ${resolutionStatus === 'approved' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={executeResolution}
                  disabled={submitting}
                >
                  {submitting ? 'Resolving...' : `Confirm ${resolutionStatus === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
