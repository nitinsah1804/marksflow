import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  Sliders
} from 'lucide-react';

export default function ConsolidatedMasterSheet({
  consolidatedData,
  groupsData,
  currentCourse,
  currentUser,
  onSubmitToHOD,
  onOpenGradeCutoffs,
  onSelectStudent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  if (!consolidatedData) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
          <FileSpreadsheet size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Loading Master Compilation Sheet...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving component marks, dynamic weightage calculations, and student records.</p>
      </div>
    );
  }

  const course = currentCourse || {};
  const stats = consolidatedData?.analytics || consolidatedData?.stats || {};
  const rows = consolidatedData?.students || consolidatedData?.rows || [];
  const isFacultyOrHOD = currentUser?.role === 'faculty' || currentUser?.role === 'hod';
  const isLocked = consolidatedData?.is_locked || course?.is_locked;

  // Extract structured groups with components
  // Can come from groupsData OR from first student's calculated groups
  let groups = [];
  if (groupsData?.groups?.length > 0) {
    groups = groupsData.groups.map((grp) => ({
      ...grp,
      components: (groupsData.components || []).filter((c) => c.group_id === grp.id)
    }));
  } else if (rows[0]?.groups) {
    groups = rows[0].groups.map((g) => ({
      id: g.group_id,
      name: g.group_name,
      weightage_percent: g.group_weightage,
      rule_type: g.rule_type,
      best_n_count: g.best_n_count,
      components: g.components?.map((c) => ({
        id: c.component_id,
        name: c.name,
        code: c.code,
        max_marks: c.max_marks
      })) || []
    }));
  }

  // Filter rows
  const q = searchQuery.toLowerCase().trim();
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !q ||
      row.student_name?.toLowerCase().includes(q) ||
      row.roll_number?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q);

    const matchesGrade = selectedGrade === 'ALL' || row.grade === selectedGrade;

    let matchesStatus = true;
    if (selectedStatus === 'AT_RISK') matchesStatus = row.is_at_risk;
    if (selectedStatus === 'HIGH') matchesStatus = row.total_marks >= 80;
    if (selectedStatus === 'PASSED') matchesStatus = row.is_passed;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Export Excel handler
  const handleExportExcel = () => {
    const courseId = course?.id || consolidatedData?.course_id;
    if (!courseId) return;
    window.open(`/api/courses/${courseId}/export/excel`, '_blank');
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Stats values
  const classAvg = stats.mean_score ?? stats.class_average ?? 0;
  const passRate = stats.pass_percentage ?? stats.pass_rate ?? 0;
  const highestMark = stats.highest_score ?? stats.highest_mark ?? 0;
  const lowestMark = stats.lowest_score ?? stats.lowest_mark ?? 0;
  const totalStudents = stats.total_students ?? rows.length;
  const atRiskCount = stats.at_risk_count ?? rows.filter((r) => r.is_at_risk).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Header & Actions Toolbar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                {course.code ? `${course.code}: ${course.title}` : 'Consolidated Master Internal Marks Sheet'}
              </h2>
              <span className={`badge ${isLocked ? 'badge-rose' : 'badge-emerald'}`}>
                {isLocked ? <><Lock size={12} /> Locked & Verified</> : <><CheckCircle2 size={12} /> Live Calculation</>}
              </span>
            </div>
            <div className="detail-extra" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span><strong>Institute:</strong> SIT Nagpur (SIU)</span>
              <span>&bull;</span>
              <span><strong>Department:</strong> {course.department || 'Department of Computer Science & Engineering'}</span>
              <span>&bull;</span>
              <span><strong>Instructor:</strong> {course.instructor_name || 'Dr. Snehlata Wankhade'}</span>
              <span>&bull;</span>
              <span><strong>Semester:</strong> {course.semester || 'B.Tech CSE - Semester IV'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} title="Download Formatted Multi-Sheet Excel">
              <Download size={15} style={{ color: 'var(--emerald)' }} />
              <span>Export Master Excel</span>
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Print Clean Audit Record">
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>

            {isFacultyOrHOD && (
              <button className="btn btn-secondary btn-sm" onClick={onOpenGradeCutoffs} title="Configure Grade Boundaries">
                <Sliders size={15} />
                <span>Grade Cutoffs</span>
              </button>
            )}

            {isFacultyOrHOD && !isLocked && course?.submission_status !== 'submitted' && course?.status !== 'submitted' && (
              <button className="btn btn-primary btn-sm" onClick={onSubmitToHOD} title="Submit finalized internal marks to HOD for approval">
                <Send size={14} />
                <span>Submit to HOD</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Class Average</span>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {classAvg ? `${Number(classAvg).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">
            <span>Target: &gt;= 70% institutional norm</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Pass Rate</span>
            <CheckCircle2 size={16} style={{ color: 'var(--emerald)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--emerald)' }}>
            {passRate ? `${Number(passRate).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">
            <span>{rows.filter((r) => r.is_passed).length} of {rows.length} students cleared</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Highest Mark</span>
            <Award size={16} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {highestMark ? `${Number(highestMark).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="stat-subtext">
            <span>Lowest cohort mark: {lowestMark ? Number(lowestMark).toFixed(1) : '0.0'}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Enrolled Cohort</span>
            <Users size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="stat-value">
            {totalStudents}
          </div>
          <div className="stat-subtext">
            <span>Active registered students</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: atRiskCount > 0 ? 'var(--rose-border)' : 'var(--border)' }}>
          <div className="stat-header">
            <span>At-Risk Alert</span>
            <AlertTriangle size={16} style={{ color: atRiskCount > 0 ? 'var(--rose)' : 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ color: atRiskCount > 0 ? 'var(--rose)' : 'var(--text-primary)' }}>
            {atRiskCount}
          </div>
          <div className="stat-subtext" style={{ color: atRiskCount > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
            <span>{atRiskCount > 0 ? 'Score < 50% threshold' : 'Cohort healthy'}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search roll number, student name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSearchQuery('')}>Clear</button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Grade:</span>
              <select
                className="select"
                style={{ width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.8125rem' }}
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="ALL">All Grades</option>
                <option value="O">O (Outstanding)</option>
                <option value="A+">A+ (Excellent)</option>
                <option value="A">A (Very Good)</option>
                <option value="B+">B+ (Good)</option>
                <option value="B">B (Above Avg)</option>
                <option value="C">C (Average)</option>
                <option value="F">F (Fail)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="select"
                style={{ width: '130px', padding: '0.35rem 0.6rem', fontSize: '0.8125rem' }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Cohort</option>
                <option value="AT_RISK">At-Risk Only</option>
                <option value="HIGH">High Performers (&gt;=80%)</option>
                <option value="PASSED">Passed</option>
              </select>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredRows.length} of {rows.length} students
            </div>
          </div>
        </div>
      </div>

      {/* 4. Consolidated Master Data Table */}
      <div className="table-card">
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              {/* Top Level Category Headers */}
              <tr>
                <th className="sticky-col-roll" rowSpan={2} style={{ textAlign: 'center' }}>
                  Roll No
                </th>
                <th className="sticky-col-name" rowSpan={2}>
                  Student Name
                </th>

                {groups.map((grp) => (
                  <th
                    key={grp.id}
                    colSpan={(grp.components?.length || 0) + 1}
                    style={{
                      textAlign: 'center',
                      borderLeft: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800 }}>{grp.name}</span>
                      <span className="badge badge-blue">{grp.weightage_percent}% Weight</span>
                      {grp.rule_type === 'best_n' && (
                        <span className="badge badge-amber">Best {grp.best_n_count} Rule</span>
                      )}
                    </div>
                  </th>
                ))}

                <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '2px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
                  Total (100)
                </th>
                <th rowSpan={2} style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                  Grade
                </th>
                <th rowSpan={2} style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                  Standing
                </th>
                <th rowSpan={2} style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                  Action
                </th>
              </tr>

              {/* Sub Headers for Each Component */}
              <tr>
                {groups.map((grp) => (
                  <React.Fragment key={`sub-${grp.id}`}>
                    {grp.components?.map((cmp) => (
                      <th
                        key={cmp.id}
                        style={{
                          textAlign: 'center',
                          fontSize: '0.7rem',
                          minWidth: '85px',
                          borderLeft: '1px solid var(--border-subtle)'
                        }}
                        title={`${cmp.name} (Max: ${cmp.max_marks})`}
                      >
                        <div>{cmp.code}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                          ({cmp.max_marks} M)
                        </div>
                      </th>
                    ))}
                    <th
                      style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        minWidth: '90px'
                      }}
                    >
                      Weighted ({grp.weightage_percent}%)
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={25} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No students match your search filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr key={row.student_id} style={{ cursor: 'pointer' }}>
                      {/* Sticky Roll Number */}
                      <td
                        className="sticky-col-roll"
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center' }}
                      >
                        {row.roll_number}
                      </td>

                      {/* Sticky Student Name */}
                      <td className="sticky-col-name">
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.student_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {row.email}
                        </div>
                      </td>

                      {/* Group and Component Columns */}
                      {row.groups?.map((grpData) => {
                        return (
                          <React.Fragment key={`row-grp-${grpData.group_id}`}>
                            {grpData.components?.map((cmpData) => {
                              const isDropped = cmpData.is_included === false;
                              return (
                                <td
                                  key={`cmp-${cmpData.component_id}`}
                                  style={{
                                    textAlign: 'center',
                                    borderLeft: '1px solid var(--border-subtle)',
                                    opacity: isDropped ? 0.45 : 1
                                  }}
                                  title={
                                    isDropped
                                      ? `Score: ${cmpData.marks_obtained} (Dropped by Best-${grpData.best_n_count} Rule)`
                                      : `Score: ${cmpData.marks_obtained} (Counted)`
                                  }
                                >
                                  {cmpData.is_absent ? (
                                    <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                                      ABS
                                    </span>
                                  ) : (
                                    <div>
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          textDecoration: isDropped ? 'line-through' : 'none',
                                          color: isDropped ? 'var(--text-dim)' : 'var(--text-primary)'
                                        }}
                                      >
                                        {cmpData.marks_obtained !== null && cmpData.marks_obtained !== undefined
                                          ? cmpData.marks_obtained
                                          : '-'}
                                      </span>
                                      {isDropped && (
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>dropped</div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Group Weighted Contribution Column */}
                            <td
                              style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {grpData.weighted_contribution?.toFixed(1) || '0.0'}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Final Total Marks */}
                      <td
                        style={{
                          textAlign: 'center',
                          borderLeft: '2px solid var(--border)',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-display)',
                          color: row.total_marks >= 80 ? 'var(--emerald)' : row.is_at_risk ? 'var(--rose)' : 'var(--primary)'
                        }}
                      >
                        {row.total_marks?.toFixed(1) || '0.0'}
                      </td>

                      {/* Letter Grade */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${
                            row.grade === 'O' || row.grade === 'A+'
                              ? 'badge-emerald'
                              : row.grade === 'A' || row.grade === 'B+'
                              ? 'badge-blue'
                              : row.grade === 'F'
                              ? 'badge-rose'
                              : 'badge-amber'
                          }`}
                          style={{ fontWeight: 800 }}
                        >
                          {row.grade}
                        </span>
                      </td>

                      {/* Academic Standing */}
                      <td style={{ textAlign: 'center' }}>
                        {row.is_at_risk ? (
                          <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                            <AlertTriangle size={11} /> At Risk
                          </span>
                        ) : (
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                            <CheckCircle2 size={11} /> Normal
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => onSelectStudent && onSelectStudent(row)}
                          title="View complete mathematical calculation breakdown"
                        >
                          <span>Breakdown</span>
                          <ChevronRight size={13} />
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
