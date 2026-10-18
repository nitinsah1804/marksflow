import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function StudentCohortInspector({
  currentCourse,
  currentUser,
  studentsList = [],
  onOpenRevaluationModal,
  showToast
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    studentsList[0]?.id || 'usr-stu-1'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [breakdownData, setBreakdownData] = useState(null);
  const [loading, setLoading] = useState(false);

  // If studentsList changes and selectedStudentId is not in it, pick first
  useEffect(() => {
    if (studentsList.length > 0 && !studentsList.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(studentsList[0].id);
    }
  }, [studentsList, selectedStudentId]);

  // Load student breakdown
  useEffect(() => {
    const courseId = currentCourse?.id;
    if (!selectedStudentId || !courseId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/${selectedStudentId}/course/${courseId}/breakdown`);
        if (!res.ok) throw new Error('Failed to load student breakdown');
        const data = await res.json();
        if (isMounted) {
          setBreakdownData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId, currentCourse?.id]);

  // Filter students by search
  const q = searchQuery.toLowerCase().trim();
  const filteredStudents = studentsList.filter(
    (s) =>
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
  );

  const perf = breakdownData?.student_performance || breakdownData;
  const revaluations = breakdownData?.revaluation_requests || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Inspector Header & Student Selector Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                Student Cohort Drilldown &amp; Report Card Inspector
              </h2>
              <span className="badge badge-purple">
                <Users size={12} /> Faculty Inspection Suite
              </span>
            </div>
            <div className="detail-extra" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span><strong>Course:</strong> {currentCourse?.code} · {currentCourse?.title}</span>
              <span>&bull;</span>
              <span><strong>Total Enrolled:</strong> {studentsList.length} Students</span>
              <span>&bull;</span>
              <span><strong>Instructor:</strong> {currentCourse?.instructor_name || currentUser?.name}</span>
            </div>
          </div>

          {/* Student Selector Dropdown with Quick Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '1.85rem', fontSize: '0.8125rem', height: '36px' }}
                placeholder="Search PRN / Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="select"
              style={{ width: '260px', fontWeight: 600, height: '36px', fontSize: '0.8125rem' }}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {filteredStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.roll_number ? `(${st.roll_number})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading || !perf ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading student evaluation records...
        </div>
      ) : (
        <>
          {/* 2. Top Summary KPI Cards for the inspected Student */}
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
                <span>Computed Grade</span>
                <Award size={16} style={{ color: 'var(--amber)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--amber)' }}>
                {perf.grade || 'N/A'}
              </div>
              <div className="stat-subtext">{perf.grade_desc || 'Standard scale'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Grade Point</span>
                <BookOpen size={16} style={{ color: 'var(--emerald)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--emerald)' }}>
                {perf.grade_point || 0} / 10
              </div>
              <div className="stat-subtext">GPA weight multiplier</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Academic Standing</span>
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
                {perf.is_passed ? 'Passing threshold met' : 'Below 50% passing threshold'}
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
                        Contribution
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
                          <th style={{ textAlign: 'center' }}>Rule Evaluation Status</th>
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
                                    Dropped (Lowest Score)
                                  </span>
                                ) : (
                                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                                    <CheckCircle2 size={12} /> Included in Calculation
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

          {/* 4. Student Grievances & Moderation History (Faculty View) */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                <Clock size={18} style={{ color: 'var(--amber)' }} />
                <span>Grievances &amp; Revaluation Requests Filed by this Student ({revaluations.length})</span>
              </div>
              {onOpenRevaluationModal && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenRevaluationModal}
                  style={{ fontSize: '0.75rem' }}
                >
                  <ExternalLink size={13} /> Open All Course Grievances
                </button>
              )}
            </div>

            <div className="card-body">
              {revaluations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No grievances or revaluation requests filed by this student for this course.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {revaluations.map((rev) => {
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
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {rev.component_name} ({rev.component_code})
                          </span>
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
                          Current Awarded: <strong>{rev.current_marks}</strong> &rarr; Student Expected:{' '}
                          <strong>{rev.expected_marks}</strong>
                          {rev.adjusted_marks !== null && isApproved && (
                            <span style={{ color: 'var(--emerald)', marginLeft: '0.5rem', fontWeight: 700 }}>
                              Adjusted Score: {rev.adjusted_marks}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <strong>Student Justification:</strong> {rev.reason}
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
                            <strong>Faculty Resolution Note:</strong> {rev.faculty_response}
                          </div>
                        )}
                        {isPending && onOpenRevaluationModal && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={onOpenRevaluationModal}
                              style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                            >
                              Resolve Grievance in Manager &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
