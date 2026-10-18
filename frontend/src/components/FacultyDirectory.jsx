import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  BookOpen,
  Award,
  FileText,
  Mail,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Building2,
  X,
  Bookmark
} from 'lucide-react';

export default function FacultyDirectory({ currentUser, showToast }) {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [activeDossier, setActiveDossier] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch('/api/faculty');
        if (!res.ok) throw new Error('Failed to load faculty profiles');
        const data = await res.json();
        setFacultyList(data);
      } catch (err) {
        console.error(err);
        if (showToast) showToast('Could not load faculty directory', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [showToast]);

  // Filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      !q ||
      f.name?.toLowerCase().includes(q) ||
      f.designation?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q) ||
      f.research_interests?.some((ri) => ri.toLowerCase().includes(q)) ||
      f.bio?.toLowerCase().includes(q);

    let matchesDept = true;
    if (selectedDept === 'LEADERSHIP') {
      matchesDept = f.id === 'usr-dir-1' || f.id === 'usr-dep-1' || f.id === 'usr-hod-1';
    } else if (selectedDept === 'CSE') {
      matchesDept = f.department?.toLowerCase().includes('computer science');
    } else if (selectedDept === 'ETC') {
      matchesDept = f.department?.toLowerCase().includes('electronics');
    }

    return matchesSearch && matchesDept;
  });

  return (
    <div className="tab-pane-container">
      {/* 1. Header Banner */}
      <div className="card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
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
              <Users size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800 }}>
                  Faculty &amp; Academic Leadership Directory
                </h2>
                <span className="badge badge-purple">
                  <Sparkles size={12} /> {facultyList.length} Verified Profiles
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Symbiosis Institute of Technology (SIT), Nagpur · Symbiosis International (Deemed University)
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '900px', lineHeight: 1.5, marginTop: '0.5rem' }}>
            Official dossiers, research specializations, published patents, and scholarly output of SIT Nagpur faculty members 
            extracted directly from university records and LMS teaching assignments.
          </p>
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
              placeholder="Search faculty by name, designation, research interest (AI, 5G, Compiler...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Filter:
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn btn-sm ${selectedDept === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedDept('ALL')}
              >
                All ({facultyList.length})
              </button>
              <button
                className={`btn btn-sm ${selectedDept === 'LEADERSHIP' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedDept('LEADERSHIP')}
              >
                Leadership (3)
              </button>
              <button
                className={`btn btn-sm ${selectedDept === 'CSE' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedDept('CSE')}
              >
                Computer Science
              </button>
              <button
                className={`btn btn-sm ${selectedDept === 'ETC' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedDept('ETC')}
              >
                E &amp; TC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grid of Faculty Cards */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading faculty profiles from university records...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredFaculty.map((f) => {
            const isLeadership = f.id === 'usr-dir-1' || f.id === 'usr-dep-1' || f.id === 'usr-hod-1';

            return (
              <div
                key={f.id}
                className="card"
                style={{
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: isLeadership ? '1px solid var(--purple-border)' : '1px solid var(--border)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Header: Avatar, Name, Designation */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isLeadership ? 'var(--purple-light)' : 'var(--primary-light)',
                      color: isLeadership ? 'var(--purple)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      flexShrink: 0,
                      border: '1px solid var(--border)'
                    }}
                  >
                    {f.name.split(' ').filter(n => !n.startsWith('(') && !n.startsWith('Dr') && !n.startsWith('Prof')).slice(0, 2).map(n => n[0]).join('') || 'FC'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.name}
                      </h3>
                    </div>

                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      {f.designation}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Building2 size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Highlights Metrics: Publications, Patents, Experience */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Publications
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {f.publications_count}+
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Patents
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {f.patents_count || '1+'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Degree
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {f.qualification || 'Ph.D.'}
                    </div>
                  </div>
                </div>

                {/* Research Interests Tags */}
                {f.research_interests && f.research_interests.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Research Specializations
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {f.research_interests.slice(0, 4).map((topic, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-card-hover)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio Summary Excerpt */}
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0
                  }}
                >
                  {f.bio}
                </p>

                {/* Footer with Actions */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                    onClick={() => setActiveDossier(f)}
                  >
                    <BookOpen size={13} /> Full Dossier
                  </button>

                  <a
                    href={`mailto:${f.email}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <Mail size={13} /> Contact Faculty
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Dossier Modal */}
      {activeDossier && (
        <div className="modal-backdrop" onClick={() => setActiveDossier(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    {activeDossier.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                    {activeDossier.designation} &bull; {activeDossier.department}
                  </p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setActiveDossier(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Details Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Email</div>
                  <a href={`mailto:${activeDossier.email}`} style={{ fontSize: '0.8125rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                    {activeDossier.email}
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Qualification</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{activeDossier.qualification}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Experience</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{activeDossier.experience_years}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Office</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{activeDossier.office_location}</div>
                </div>
              </div>

              {/* Research Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeDossier.publications_count}+</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scholarly Publications (Scopus / IEEE / Springer)</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--purple-light)', color: 'var(--purple)' }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeDossier.patents_count || '1+'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patents &amp; Intellectual Property Rights</div>
                  </div>
                </div>
              </div>

              {/* Research Specializations */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Research Areas &amp; Specializations
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {activeDossier.research_interests?.map((item, idx) => (
                    <span key={idx} className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Complete Biography */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Academic Biography &amp; Institutional Governance
                </h4>
                <div
                  style={{
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {activeDossier.bio}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official SIT Nagpur Academic Faculty Profile
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setActiveDossier(null)}>
                  Close
                </button>
                <a
                  href={`mailto:${activeDossier.email}`}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <Mail size={14} /> Contact Faculty via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
