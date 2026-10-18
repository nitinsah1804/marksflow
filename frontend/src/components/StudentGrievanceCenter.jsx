import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function StudentGrievanceCenter({
  currentCourse,
  currentUser,
  showToast
}) {
  const [breakdownData, setBreakdownData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revalComponentId, setRevalComponentId] = useState('');
  const [expectedMarks, setExpectedMarks] = useState('');
  const [revalReason, setRevalReason] = useState('');
  const [submittingReval, setSubmittingReval] = useState(false);
  const [myRevaluations, setMyRevaluations] = useState([]);

  const studentId = currentUser?.id;

  const loadStudentGrievances = async () => {
    if (!studentId || !currentCourse?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${studentId}/course/${currentCourse.id}/breakdown`);
      if (!res.ok) throw new Error('Failed to load student breakdown');
      const data = await res.json();
      setBreakdownData(data);
      const perf = data.student_performance || data;
      if (perf.groups?.[0]?.components?.[0]) {
        setRevalComponentId(perf.groups[0].components[0].component_id);
      }
      if (Array.isArray(data.revaluation_requests)) {
        setMyRevaluations(data.revaluation_requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentGrievances();
  }, [studentId, currentCourse?.id]);

  const handleCreateRevaluation = async (e) => {
    e.preventDefault();
    if (!revalComponentId || !expectedMarks || !revalReason.trim()) {
      if (showToast) showToast('Please select a component, specify expected marks, and give a clear justification.', 'error');
      return;
    }

    setSubmittingReval(true);
    try {
      const perf = breakdownData?.student_performance || breakdownData || {};
      let curMarks = 0;
      perf.groups?.forEach((g) => {
        g.components?.forEach((c) => {
          if (c.component_id === revalComponentId) {
            curMarks = c.marks_obtained || 0;
          }
        });
      });

      const res = await fetch('/api/revaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: currentCourse.id,
          component_id: revalComponentId,
          student_id: studentId,
          current_marks: curMarks,
          expected_marks: parseFloat(expectedMarks),
          reason: revalReason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to submit grievance');
      }

      if (showToast) showToast('Revaluation grievance submitted to faculty course incharge!', 'success');
      setExpectedMarks('');
      setRevalReason('');
      await loadStudentGrievances();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSubmittingReval(false);
    }
  };

  const perf = breakdownData?.student_performance || breakdownData;
  const allComponents = [];
  perf?.groups?.forEach((g) => {
    g.components?.forEach((c) => {
      allComponents.push(c);
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--amber-light)',
              color: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800 }}>
                Student Grievance &amp; Revaluation Center
              </h2>
              <span className="badge badge-amber">Official Redressal Portal</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              SIT Nagpur Academic Dispute Policy &bull; Discrepancies in Quizzes, Mid-Term, or Lab Evaluations can be submitted directly to course faculty.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} style={{ color: 'var(--primary)' }} />
              Submit New Revaluation Grievance
            </div>
          </div>
          <form onSubmit={handleCreateRevaluation} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group">
              <label className="label">Assessment Component Under Dispute:</label>
              <select
                className="select"
                value={revalComponentId}
                onChange={(e) => setRevalComponentId(e.target.value)}
              >
                {allComponents.length === 0 ? (
                  <option value="">Loading assessment components...</option>
                ) : (
                  allComponents.map((c) => (
                    <option key={c.component_id} value={c.component_id}>
                      {c.code}: {c.name} (Your Current Score: {c.marks_obtained !== null ? c.marks_obtained : 'N/A'}/{c.max_marks})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Expected / Disputed Score:</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="input"
                placeholder="Enter score you believe you earned (e.g. 42)"
                value={expectedMarks}
                onChange={(e) => setExpectedMarks(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Detailed Academic Justification:</label>
              <textarea
                className="textarea"
                rows={4}
                placeholder="State precise reason (e.g., Question 3b algorithm complexity step was answered correctly as per prescribed Cormen text; front page marks summation was 42 but entered as 32)..."
                value={revalReason}
                onChange={(e) => setRevalReason(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingReval || allComponents.length === 0}
              style={{ alignSelf: 'flex-start', padding: '0.65rem 1.25rem', fontWeight: 700 }}
            >
              <Send size={14} />
              <span>{submittingReval ? 'Submitting to Faculty...' : 'Submit Grievance to Course Faculty'}</span>
            </button>
          </form>
        </div>

        {/* Status Tracker Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--amber)' }} />
              Grievance History &amp; Faculty Review Status ({myRevaluations.length})
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading grievance records...
              </div>
            ) : myRevaluations.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--emerald)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  No Disputed Marks on File
                </div>
                You currently have no active grievances or revaluation requests for this course.
              </div>
            ) : (
              myRevaluations.map((rev) => {
                const isPending = rev.status === 'pending';
                const isApproved = rev.status === 'approved';
                return (
                  <div
                    key={rev.id}
                    className="card"
                    style={{
                      padding: '1rem',
                      borderLeft: `4px solid ${
                        isPending ? 'var(--amber)' : isApproved ? 'var(--emerald)' : 'var(--rose)'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {rev.component_name} ({rev.component_code})
                      </span>
                      <span
                        className={`badge ${
                          isPending ? 'badge-amber' : isApproved ? 'badge-emerald' : 'badge-rose'
                        }`}
                        style={{ textTransform: 'capitalize', fontWeight: 700 }}
                      >
                        {rev.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Awarded: <strong>{rev.current_marks}</strong> &rarr; Expected:{' '}
                      <strong>{rev.expected_marks}</strong>
                      {rev.adjusted_marks !== null && isApproved && (
                        <span style={{ color: 'var(--emerald)', marginLeft: '0.5rem', fontWeight: 800 }}>
                          Adjusted to: {rev.adjusted_marks}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      <strong>Your Justification:</strong> {rev.reason}
                    </div>

                    {rev.faculty_response ? (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          marginTop: '0.5rem',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <strong>Faculty Evaluation Decision:</strong> {rev.faculty_response}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: 'var(--amber)', marginTop: '0.4rem', fontWeight: 600 }}>
                        &bull; Pending faculty review by Course Incharge.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
