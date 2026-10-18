import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  GraduationCap,
  Award,
  Layers,
  FileText,
  Filter,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function SyllabusExplorer({ showToast }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const res = await fetch('/api/syllabus/courses');
        if (!res.ok) throw new Error('Failed to load syllabus catalog');
        const data = await res.json();
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0]);
      } catch (err) {
        console.error(err);
        if (showToast) showToast('Could not load syllabus files', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabus();
  }, [showToast]);

  const q = searchQuery.toLowerCase().trim();
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.specialization?.toLowerCase().includes(q) ||
      c.objectives?.some((o) => o.toLowerCase().includes(q));

    let matchesSem = true;
    if (selectedSemester === 'SEM1') matchesSem = c.semester_folder.includes('Semester 1');
    else if (selectedSemester === 'SEM3') matchesSem = c.semester_folder.includes('Semester 3');
    else if (selectedSemester === 'SEM5') matchesSem = c.semester_folder.includes('Semester 5');
    else if (selectedSemester === 'SEM7') matchesSem = c.semester_folder.includes('Semester 7');

    return matchesSearch && matchesSem;
  });

  return (
    <div className="tab-pane-container">
      {/* 1. Header Banner */}
      <div className="card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800 }}>
                Official SIT Nagpur Curriculum &amp; Syllabus Explorer
              </h2>
              <span className="badge badge-blue">
                <Sparkles size={12} /> Session ODD 2026-27
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Comprehensive curriculum guidelines, course learning objectives, and credit distributions extracted from university syllabus records.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.35rem' }}
              placeholder="Search by course code (e.g. TEE7300), title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`btn btn-sm ${selectedSemester === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setSelectedSemester('ALL')}
            >
              All Semesters ({courses.length})
            </button>
            <button
              className={`btn btn-sm ${selectedSemester === 'SEM1' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setSelectedSemester('SEM1')}
            >
              Sem 1 (Batch 26-30)
            </button>
            <button
              className={`btn btn-sm ${selectedSemester === 'SEM3' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setSelectedSemester('SEM3')}
            >
              Sem 3
            </button>
            <button
              className={`btn btn-sm ${selectedSemester === 'SEM5' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setSelectedSemester('SEM5')}
            >
              Sem 5
            </button>
            <button
              className={`btn btn-sm ${selectedSemester === 'SEM7' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setSelectedSemester('SEM7')}
            >
              Sem 7
            </button>
          </div>
        </div>
      </div>

      {/* 3. Master / Detail Layout */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading official syllabus catalog from university repository...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left Column: Course List */}
          <div
            className="card"
            style={{
              padding: '0.75rem',
              maxHeight: '680px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>
              Courses ({filteredCourses.length})
            </div>
            {filteredCourses.map((c) => {
              const isSelected = selectedCourse?.code === c.code;
              return (
                <button
                  key={`${c.code}-${c.filename}`}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    height: 'auto',
                    width: '100%'
                  }}
                  onClick={() => setSelectedCourse(c)}
                >
                  <div style={{ minWidth: 0, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                        {c.code}
                      </span>
                      <span style={{ fontSize: '0.7rem', opacity: isSelected ? 1 : 0.7, fontWeight: 600 }}>
                        {c.credits} Credits
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: isSelected ? 0.9 : 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.semester_folder}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Course Detailed View */}
          {selectedCourse ? (
            <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                    {selectedCourse.code}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                    {selectedCourse.credits} Credits
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                    {selectedCourse.semester_folder}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>
                  {selectedCourse.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Faculty: {selectedCourse.faculty_dept} &bull; Specialization: {selectedCourse.specialization}
                </p>
              </div>

              {/* Learning Objectives */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} style={{ color: 'var(--primary)' }} />
                  Course Learning Outcomes &amp; Objectives
                </h4>
                {selectedCourse.objectives && selectedCourse.objectives.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedCourse.objectives.map((obj, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.825rem',
                          lineHeight: 1.5
                        }}
                      >
                        <CheckCircle2 size={15} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Refer to official syllabus document for detailed modular topics and laboratory experiments.
                  </p>
                )}
              </div>

              {/* Examination & Assessment Blueprint */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} style={{ color: 'var(--primary)' }} />
                  Continuous Evaluation Architecture (Internal Marks)
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      CIE Tests Weightage
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      40%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Best-of-N Rule Applied</div>
                  </div>

                  <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Problem Sets &amp; Mini-Project
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--purple)' }}>
                      20%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Practical Code Artifacts</div>
                  </div>

                  <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Lab Practical &amp; Viva
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald)' }}>
                      40%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hands-On Examination</div>
                  </div>
                </div>
              </div>

              {/* Source Document File Information */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} />
                  <span>Document: <strong>{selectedCourse.filename}</strong> ({selectedCourse.page_count} pages)</span>
                </div>
                <span>SIT Nagpur Session ODD 2026-27</span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
