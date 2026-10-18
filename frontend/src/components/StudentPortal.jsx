import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  AlertCircle,
  Send,
  Clock,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  FileText,
  BarChart2,
  ShieldCheck
} from 'lucide-react';

export default function StudentPortal({
  currentCourse,
  currentUser,
  showToast
}) {
  const [breakdownData, setBreakdownData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Grievance submission form state
  const [revalComponentId, setRevalComponentId] = useState('');
  const [expectedMarks, setExpectedMarks] = useState('');
  const [revalReason, setRevalReason] = useState('');
  const [submittingReval, setSubmittingReval] = useState(false);
  const [myRevaluations, setMyRevaluations] = useState([]);

  const studentId = currentUser?.id;

  // Load student breakdown for the current course
  useEffect(() => {
    const courseId = currentCourse?.id;
    if (!studentId || !courseId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/${studentId}/course/${courseId}/breakdown`);
        if (!res.ok) throw new Error('Failed to load student breakdown');
        const data = await res.json();
        if (isMounted) {
          setBreakdownData(data);
          const perf = data.student_performance || data;
          if (perf.groups?.[0]?.components?.[0]) {
            setRevalComponentId(perf.groups[0].components[0].component_id);
          }
          if (Array.isArray(data.revaluation_requests)) {
            setMyRevaluations(data.revaluation_requests);
          }
        }
      } catch (err) {
        console.error('Failed to load breakdown:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [studentId, currentCourse?.id]);

  // Submit student grievance
  const handleCreateRevaluation = async (e) => {
    e.preventDefault();
    if (!revalComponentId || !expectedMarks || !revalReason.trim()) {
      if (showToast) showToast('Please select a component, enter your expected marks, and provide a clear justification.', 'error');
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

      // Refresh breakdown
      const bRes = await fetch(`/api/student/${studentId}/course/${currentCourse.id}/breakdown`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBreakdownData(bData);
        if (Array.isArray(bData.revaluation_requests)) {
          setMyRevaluations(bData.revaluation_requests);
        }
      }
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
      {/* 1. Student Identity & Course Enrollment Header Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800 }}>
                My Internal Marks &amp; Evaluation Breakdown
              </h2>
              <span className="badge badge-emerald">
                <ShieldCheck size={12} /> Live Transparent System
              </span>
            </div>
            <div className="detail-extra" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span><strong>Student:</strong> {currentUser?.name}</span>
              <span>&bull;</span>
              <span><strong>PRN:</strong> {currentUser?.roll_number}</span>
              <span>&bull;</span>
              <span><strong>College Email:</strong> {currentUser?.email}</span>
              <span>&bull;</span>
              <span><strong>Academic Batch:</strong> {currentUser?.department || 'B.Tech CSE (Batch 2026-30)'}</span>
              <span>&bull;</span>
              <span><strong>Course:</strong> {currentCourse?.code} · {currentCourse?.title} ({currentCourse?.credits} Credits)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Instructor: {currentCourse?.instructor_name || 'Prof. Sarvat Ali'}
            </span>
          </div>
        </div>
      </div>

      {loading || !perf ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your evaluation and grade breakdown...
        </div>
      ) : (
        <>
          {/* 2. Top Summary KPI Cards for this Student */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Final Internal Total</span>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {perf.total_marks ? Number(perf.total_marks).toFixed(1) : '0.0'}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> / 100</span>
              </div>
              <div className="stat-subtext">Cumulative weighted internal score</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Projected Letter Grade</span>
                <Award size={16} style={{ color: 'var(--amber)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--amber)' }}>
                {perf.grade || 'N/A'}
              </div>
              <div className="stat-subtext">{perf.grade_desc || 'Passing standard'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Grade Point (10-Scale)</span>
                <BookOpen size={16} style={{ color: 'var(--emerald)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--emerald)' }}>
                {perf.grade_point || 0} / 10
              </div>
              <div className="stat-subtext">Normalized credit multiplier</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Academic Status</span>
                {perf.is_passed ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--emerald)' }} />
                ) : (
                  <AlertCircle size={16} style={{ color: 'var(--rose)' }} />
                )}
              </div>
              <div className="stat-value" style={{ color: perf.is_passed ? 'var(--emerald)' : 'var(--rose)' }}>
                {perf.is_passed ? 'Cleared' : 'At-Risk'}
              </div>
              <div className="stat-subtext">
                {perf.is_passed ? 'Meets university passing threshold (>50%)' : 'Remedial internal required to pass'}
              </div>
            </div>
          </div>

          {/* 3. Detailed Component Breakdown by Evaluation Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {perf.groups?.map((grp) => {
              return (
                <div key={grp.group_id} className="card">
                  <div className="card-header" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{grp.group_name}</h3>
                        <span className="badge badge-blue">{grp.group_weightage}% Course Weight</span>
                        {grp.rule_type === 'best_n' && (
                          <span className="badge badge-amber">Best {grp.best_n_count} Rule Applied</span>
                        )}
                      </div>
                      <div className="detail-extra" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {grp.explanation}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Weighted Contribution
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {grp.weighted_contribution ? Number(grp.weighted_contribution).toFixed(1) : '0.0'} / {grp.group_weightage}
                      </div>
                    </div>
                  </div>

                  <div className="table-scroll-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '100px' }}>Code</th>
                          <th>Assessment Component</th>
                          <th style={{ textAlign: 'center' }}>Max Marks</th>
                          <th style={{ textAlign: 'center' }}>Marks Obtained</th>
                          <th style={{ textAlign: 'center' }}>Normalized %</th>
                          <th style={{ textAlign: 'center' }}>Calculation Transparency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grp.components?.map((cmp) => {
                          const isDropped = cmp.is_included === false;
                          return (
                            <tr key={cmp.component_id} style={{ opacity: isDropped ? 0.6 : 1 }}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {cmp.code}
                              </td>
                              <td style={{ fontWeight: 600 }}>{cmp.name}</td>
                              <td style={{ textAlign: 'center' }}>{cmp.max_marks}</td>
                              <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                                {cmp.is_absent ? (
                                  <span className="badge badge-rose">ABSENT</span>
                                ) : (
                                  <span style={{ textDecoration: isDropped ? 'line-through' : 'none' }}>
                                    {cmp.marks_obtained !== null && cmp.marks_obtained !== undefined ? cmp.marks_obtained : '-'}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {cmp.percentage !== null && cmp.percentage !== undefined ? `${cmp.percentage}%` : '-'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isDropped ? (
                                  <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                                    Dropped (Lowest Score in Best-of-N)
                                  </span>
                                ) : (
                                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                                    <CheckCircle2 size={12} /> Counted in Total
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Student Grievance & Revaluation Request Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {/* Submit Grievance Card */}
            <div className="card">
              <div className="card-header">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={18} style={{ color: 'var(--primary)' }} />
                  Submit Grievance / Revaluation Request
                </div>
              </div>
              <form onSubmit={handleCreateRevaluation} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label">Component Under Dispute:</label>
                  <select
                    className="select"
                    value={revalComponentId}
                    onChange={(e) => setRevalComponentId(e.target.value)}
                  >
                    {allComponents.map((c) => (
                      <option key={c.component_id} value={c.component_id}>
                        {c.code}: {c.name} (Your Score: {c.marks_obtained}/{c.max_marks})
                      </option>
                    ))}
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
                    placeholder="Enter expected marks (e.g. 42)"
                    value={expectedMarks}
                    onChange={(e) => setExpectedMarks(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Justification / Reason for Review:</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Explain clearly (e.g., Question 3b answer was verified with published key; total sum discrepancy on front page)..."
                    value={revalReason}
                    onChange={(e) => setRevalReason(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReval}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Send size={14} />
                  <span>{submittingReval ? 'Submitting...' : 'Submit Grievance to Faculty'}</span>
                </button>
              </form>
            </div>

            {/* Grievance Status History Card */}
            <div className="card">
              <div className="card-header">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: 'var(--amber)' }} />
                  Grievance &amp; Revaluation Status ({myRevaluations.length})
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myRevaluations.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No grievance requests filed for this course.
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
                          padding: '0.85rem 1rem',
                          borderLeft: `4px solid ${
                            isPending ? 'var(--amber)' : isApproved ? 'var(--emerald)' : 'var(--rose)'
                          }`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{rev.component_name}</span>
                          <span
                            className={`badge ${
                              isPending ? 'badge-amber' : isApproved ? 'badge-emerald' : 'badge-rose'
                            }`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {rev.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Current Awarded: <strong>{rev.current_marks}</strong> &rarr; Expected:{' '}
                          <strong>{rev.expected_marks}</strong>
                          {rev.adjusted_marks !== null && isApproved && (
                            <span style={{ color: 'var(--emerald)', marginLeft: '0.5rem', fontWeight: 700 }}>
                              Adjusted: {rev.adjusted_marks}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <strong>Reason:</strong> {rev.reason}
                        </div>
                        {rev.faculty_response && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-primary)',
                              marginTop: '0.35rem',
                              backgroundColor: 'var(--bg-subtle)',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            <strong>Faculty Note:</strong> {rev.faculty_response}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
