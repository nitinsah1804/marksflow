import React from 'react';
import { X, CheckCircle2, AlertCircle, Award, TrendingUp, BookOpen, Layers } from 'lucide-react';

export default function StudentDetailModal({ studentRow, onClose }) {
  if (!studentRow) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            Calculation Breakdown: {studentRow.student_name} ({studentRow.roll_number})
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Cumulative Internal Score
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                {studentRow.total_marks?.toFixed(1) || '0.0'} / 100
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>GRADE</div>
                <span className="badge badge-emerald" style={{ fontSize: '1rem', fontWeight: 800, padding: '0.2rem 0.6rem' }}>
                  {studentRow.grade}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>GRADE POINT</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{studentRow.grade_point} / 10</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>STANDING</div>
                <span className={`badge ${studentRow.is_at_risk ? 'badge-rose' : 'badge-emerald'}`}>
                  {studentRow.is_at_risk ? 'At-Risk' : 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Grouped Component Tables */}
          {studentRow.groups?.map((grp) => (
            <div key={grp.group_id} className="card">
              <div className="card-header" style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} style={{ color: 'var(--primary)' }} />
                    {grp.group_name}
                    <span className="badge badge-blue">{grp.group_weightage}% Weight</span>
                    {grp.rule_type === 'best_n' && (
                      <span className="badge badge-amber">Best {grp.best_n_count} Rule</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {grp.explanation}
                  </div>
                </div>

                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {grp.weighted_contribution?.toFixed(1)} / {grp.group_weightage}
                </div>
              </div>

              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Code</th>
                      <th>Component</th>
                      <th style={{ textAlign: 'center' }}>Max Marks</th>
                      <th style={{ textAlign: 'center' }}>Obtained</th>
                      <th style={{ textAlign: 'center' }}>Normalized %</th>
                      <th style={{ textAlign: 'center' }}>Rule Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.components?.map((cmp) => {
                      const isDropped = cmp.is_included === false;
                      return (
                        <tr key={cmp.component_id} style={{ opacity: isDropped ? 0.55 : 1 }}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cmp.code}</td>
                          <td style={{ fontWeight: 600 }}>{cmp.name}</td>
                          <td style={{ textAlign: 'center' }}>{cmp.max_marks}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            {cmp.is_absent ? (
                              <span className="badge badge-rose">ABS</span>
                            ) : (
                              <span style={{ textDecoration: isDropped ? 'line-through' : 'none' }}>
                                {cmp.marks_obtained !== null ? cmp.marks_obtained : '-'}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {cmp.percentage !== null ? `${cmp.percentage}%` : '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isDropped ? (
                              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>Dropped</span>
                            ) : (
                              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Counted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
