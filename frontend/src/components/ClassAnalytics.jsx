import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ShieldAlert
} from 'lucide-react';

export default function ClassAnalytics({ consolidatedData, onSelectStudent }) {
  if (!consolidatedData) return null;

  const stats = consolidatedData.analytics || consolidatedData.stats || {};
  const rows = consolidatedData.students || consolidatedData.rows || [];

  // Grade Distribution from analytics or calculated
  const gradeOrder = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'];
  const gradeCounts = {};
  gradeOrder.forEach((g) => { gradeCounts[g] = 0; });

  if (Array.isArray(stats.grade_distribution)) {
    stats.grade_distribution.forEach((item) => {
      gradeCounts[item.grade] = item.count;
    });
  } else {
    rows.forEach((r) => {
      if (r.grade) gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
    });
  }

  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

  // Score Range Bins
  const scoreBins = [
    { label: '90 - 100%', min: 90, max: 100, color: 'var(--emerald)', count: 0 },
    { label: '80 - 89%', min: 80, max: 89.99, color: 'var(--primary)', count: 0 },
    { label: '70 - 79%', min: 70, max: 79.99, color: 'var(--sky)', count: 0 },
    { label: '60 - 69%', min: 60, max: 69.99, color: 'var(--purple)', count: 0 },
    { label: '50 - 59%', min: 50, max: 59.99, color: 'var(--amber)', count: 0 },
    { label: '< 50% (Fail)', min: 0, max: 49.99, color: 'var(--rose)', count: 0 }
  ];

  rows.forEach((r) => {
    const mark = r.total_marks || 0;
    const bin = scoreBins.find((b) => mark >= b.min && mark <= b.max);
    if (bin) bin.count++;
  });

  const maxBinCount = Math.max(...scoreBins.map((b) => b.count), 1);

  // At-Risk Students
  const atRiskStudents = rows.filter((r) => r.is_at_risk || r.total_marks < 50);

  const classAvg = stats.mean_score ?? stats.class_average ?? 0;
  const passRate = stats.pass_percentage ?? stats.pass_rate ?? 0;
  const highestMark = stats.highest_score ?? stats.highest_mark ?? 0;
  const lowestMark = stats.lowest_score ?? stats.lowest_mark ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                Class Cohort Analytics & Statistical Insights
              </h2>
              <span className="badge badge-blue">
                {rows.length} Evaluated Students
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Norm-referenced performance metrics, grade distribution curve, and early-warning intervention indicators.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Class Mean</span>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {classAvg ? `${Number(classAvg).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">Overall weighted cohort mean</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Pass Rate</span>
            <CheckCircle2 size={16} style={{ color: 'var(--emerald)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--emerald)' }}>
            {passRate ? `${Number(passRate).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">{rows.filter((r) => r.is_passed).length} students passed</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Highest Mark</span>
            <Award size={16} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {highestMark ? `${Number(highestMark).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">Top scoring student</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Lowest Mark</span>
            <AlertTriangle size={16} style={{ color: 'var(--rose)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--rose)' }}>
            {lowestMark ? `${Number(lowestMark).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">Minimum cohort score</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>At-Risk Students</span>
            <ShieldAlert size={16} style={{ color: atRiskStudents.length > 0 ? 'var(--rose)' : 'var(--emerald)' }} />
          </div>
          <div className="stat-value" style={{ color: atRiskStudents.length > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
            {atRiskStudents.length}
          </div>
          <div className="stat-subtext">Score &lt; 50% or incomplete</div>
        </div>
      </div>

      {/* 3. Distribution Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Grade Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
              Grade Frequency Distribution
            </div>
            <span className="badge badge-slate">UGC 10-Point Scale</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {gradeOrder.map((g) => {
              const count = gradeCounts[g] || 0;
              const pct = rows.length > 0 ? ((count / rows.length) * 100).toFixed(0) : 0;
              const barWidth = `${(count / maxGradeCount) * 100}%`;

              return (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', fontWeight: 800, fontSize: '0.875rem' }}>
                    {g}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: '24px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: barWidth,
                        height: '100%',
                        backgroundColor:
                          g === 'O' || g === 'A+'
                            ? 'var(--emerald)'
                            : g === 'A' || g === 'B+'
                            ? 'var(--primary)'
                            : g === 'F'
                            ? 'var(--rose)'
                            : 'var(--amber)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ width: '70px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Range Histogram */}
        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} style={{ color: 'var(--emerald)' }} />
              Cohort Score Range Histogram
            </div>
            <span className="badge badge-slate">Out of 100</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {scoreBins.map((bin) => {
              const pct = rows.length > 0 ? ((bin.count / rows.length) * 100).toFixed(0) : 0;
              const barWidth = `${(bin.count / maxBinCount) * 100}%`;

              return (
                <div key={bin.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '100px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {bin.label}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: '24px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: barWidth,
                        height: '100%',
                        backgroundColor: bin.color,
                        borderRadius: 'var(--radius-sm)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ width: '70px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {bin.count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. At-Risk Students Action Table */}
      <div className="card">
        <div className="card-header" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--rose)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                At-Risk Academic Intervention List ({atRiskStudents.length})
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Students who need remedial coaching, re-tests, or make-up assignments to reach the passing standard.
              </div>
            </div>
          </div>
        </div>

        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Roll Number</th>
                <th>Student Particulars</th>
                <th style={{ textAlign: 'center' }}>Total Internal Score</th>
                <th style={{ textAlign: 'center' }}>Deficit to 50%</th>
                <th style={{ textAlign: 'center' }}>Projected Grade</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--emerald)' }}>
                    <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: 700 }}>Cohort is performing excellently!</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      No students are currently falling below the 50% academic risk threshold.
                    </div>
                  </td>
                </tr>
              ) : (
                atRiskStudents.map((st) => {
                  const deficit = Math.max(0, 50 - (st.total_marks || 0)).toFixed(1);
                  return (
                    <tr key={st.student_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {st.roll_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{st.student_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{st.email}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--rose)' }}>
                        {st.total_marks ? Number(st.total_marks).toFixed(1) : '0.0'} / 100
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--amber)' }}>
                        -{deficit} Marks
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-rose">{st.grade}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => onSelectStudent && onSelectStudent(st)}
                        >
                          Review Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
