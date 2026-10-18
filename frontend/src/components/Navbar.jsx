import React, { useState } from 'react';
import sitLogo from '../assets/SIT_Logo.png';
import {
  GraduationCap,
  BookOpen,
  Lock,
  Unlock,
  History,
  FileCheck2,
  Palette,
  Sun,
  Moon,
  PlusCircle,
  ChevronDown,
  AlertCircle,
  LogOut,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  courses = [],
  currentCourse,
  onSelectCourse,
  currentUser,
  onSwitchAccount,
  onLogout,
  onOpenLockModal,
  onOpenAuditLog,
  onOpenRevaluationModal,
  onOpenGradeCutoffs,
  onOpenNewCourse,
  onOpenAppearance,
  theme,
  onToggleTheme,
  detailLevel = 'minimal',
  pendingGrievancesCount = 0
}) {
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const isLocked = currentCourse?.is_locked;
  const isFacultyOrHOD = currentUser?.role === 'faculty' || currentUser?.role === 'hod';
  const isStudent = currentUser?.role === 'student';

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter((w) => !w.startsWith('(') && !w.startsWith('Dr') && !w.startsWith('Prof'))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'U'
    : 'U';

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* 1. Left: Brand Section */}
        <div className="navbar-brand-section">
          <div className="brand-logo-box" title="Symbiosis Institute of Technology (SIT), Nagpur">
            <img src={sitLogo} alt="SIT Logo" className="brand-logo-img" />
          </div>
          <div className="brand-title-wrap">
            <h1>
              <span>SIT Nagpur</span>
              <span style={{ fontWeight: 500, opacity: 0.85 }}>MarksFlow</span>
              <span className={`brand-badge ${isStudent ? 'badge-emerald' : 'badge-blue'}`}>
                {isStudent ? 'Student Portal' : 'Faculty Governance'}
              </span>
            </h1>
            <p className="brand-subtitle">
              {isStudent
                ? `B.Tech CSE (Batch 2026-30)`
                : `Symbiosis Institute of Technology · SIU`}
            </p>
          </div>
        </div>

        {/* 2. Center: Course Selector & Status Indicator */}
        <div className="navbar-center-group">
          {/* Course Selector Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
              style={{ fontWeight: 600, maxWidth: '280px', textAlign: 'left', whiteSpace: 'nowrap' }}
              title={isStudent ? 'Switch Enrolled Course' : 'Switch Active Course'}
            >
              <BookOpen size={15} style={{ color: isStudent ? 'var(--emerald)' : 'var(--primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentCourse ? `${currentCourse.code} · ${currentCourse.title}` : 'Select Course'}
              </span>
              <ChevronDown size={13} style={{ flexShrink: 0, marginLeft: '0.2rem' }} />
            </button>

            {courseDropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 60 }}
                  onClick={() => setCourseDropdownOpen(false)}
                />
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 70,
                    width: '320px',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ padding: '0.45rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isStudent ? `Enrolled Courses (${courses.length})` : `Active Courses (${courses.length})`}
                  </div>
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      className={`btn ${c.id === currentCourse?.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '0.5rem 0.65rem',
                        width: '100%',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      onClick={() => {
                        onSelectCourse(c);
                        setCourseDropdownOpen(false);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{c.code}: {c.title}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                          {c.semester} &bull; {c.credits} Credits
                        </div>
                      </div>
                    </button>
                  ))}
                  {isFacultyOrHOD && onOpenNewCourse && (
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
                        onClick={() => {
                          setCourseDropdownOpen(false);
                          onOpenNewCourse();
                        }}
                      >
                        <PlusCircle size={13} /> Create New Course
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Course Status Badge (Neatly placed next to course selector) */}
          {isFacultyOrHOD && currentCourse && (
            <div
              className={`badge ${
                isLocked
                  ? 'badge-rose'
                  : currentCourse.status === 'submitted'
                  ? 'badge-amber'
                  : 'badge-blue'
              }`}
              style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
            >
              {isLocked ? (
                <>
                  <Lock size={12} /> <span className="btn-label-responsive">Frozen</span>
                </>
              ) : currentCourse.status === 'submitted' ? (
                <>
                  <FileCheck2 size={12} /> <span className="btn-label-responsive">Submitted</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} /> <span className="btn-label-responsive">Draft Sheet</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. Right: Action Toolbar & Anchored Account Menu */}
        <div className="navbar-actions">
          {/* Grievances Moderation (Faculty View Only) */}
          {isFacultyOrHOD && onOpenRevaluationModal && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenRevaluationModal}
              title="Student Grievance / Revaluation Requests"
              style={{ position: 'relative' }}
            >
              <AlertCircle size={15} style={{ color: pendingGrievancesCount > 0 ? 'var(--amber)' : 'inherit' }} />
              <span className="btn-label-responsive">Grievances</span>
              {pendingGrievancesCount > 0 && (
                <span
                  className="badge-pulse"
                  style={{
                    backgroundColor: 'var(--rose)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {pendingGrievancesCount}
                </span>
              )}
            </button>
          )}

          {/* Audit Log (Faculty View Only) */}
          {isFacultyOrHOD && onOpenAuditLog && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenAuditLog}
              title="View Tamper-Evident Audit Timeline"
            >
              <History size={15} />
              <span className="btn-label-responsive">Audit Log</span>
            </button>
          )}

          {/* Lock / Freeze Marks (Faculty View Only) */}
          {isFacultyOrHOD && currentCourse && onOpenLockModal && (
            <button
              className={`btn btn-sm ${isLocked ? 'btn-secondary' : 'btn-outline'}`}
              onClick={onOpenLockModal}
              title={isLocked ? 'Marks are frozen. Click to unlock.' : 'Freeze final marks to prevent further editing.'}
            >
              {isLocked ? (
                <>
                  <Unlock size={14} style={{ color: 'var(--emerald)' }} />
                  <span className="btn-label-responsive">Unlock</span>
                </>
              ) : (
                <>
                  <Lock size={14} style={{ color: 'var(--rose)' }} />
                  <span className="btn-label-responsive">Freeze</span>
                </>
              )}
            </button>
          )}

          {/* Appearance Modal Trigger */}
          {onOpenAppearance && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={onOpenAppearance}
              title="Appearance Settings (Theme, Palettes, Density, Motion)"
            >
              <Palette size={16} />
            </button>
          )}

          {/* Quick Light/Dark Toggle */}
          <button
            className="btn btn-secondary btn-icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Divider separating tools and user profile */}
          <div className="navbar-divider" />

          {/* 4. User Account / Profile Menu (Anchored & Aligned) */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              className="navbar-account-btn"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              title="Account Menu (Switch Account / Sign Out)"
              aria-expanded={accountDropdownOpen}
            >
              <div
                className="navbar-account-avatar"
                style={{
                  backgroundColor: isStudent
                    ? 'var(--emerald-light)'
                    : currentUser?.role === 'hod'
                    ? 'var(--purple-light)'
                    : 'var(--primary-light)',
                  color: isStudent
                    ? 'var(--emerald)'
                    : currentUser?.role === 'hod'
                    ? 'var(--purple)'
                    : 'var(--primary)',
                  border: `1px solid ${
                    isStudent
                      ? 'var(--emerald-border)'
                      : currentUser?.role === 'hod'
                      ? 'var(--purple-border)'
                      : 'var(--primary-border)'
                  }`
                }}
              >
                {userInitials}
              </div>

              <span className="navbar-account-name">
                {currentUser ? currentUser.name : 'Account'}
              </span>

              <span
                className={`navbar-account-badge badge badge-${
                  currentUser?.role === 'hod' ? 'purple' : isStudent ? 'emerald' : 'blue'
                }`}
              >
                {currentUser?.role}
              </span>

              <ChevronDown size={14} className="navbar-account-chevron" />
            </button>

            {accountDropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 60 }}
                  onClick={() => setAccountDropdownOpen(false)}
                />
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    zIndex: 70,
                    width: '310px',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {/* User Profile Card */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isStudent
                          ? 'var(--emerald-light)'
                          : currentUser?.role === 'hod'
                          ? 'var(--purple-light)'
                          : 'var(--primary-light)',
                        color: isStudent
                          ? 'var(--emerald)'
                          : currentUser?.role === 'hod'
                          ? 'var(--purple)'
                          : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {userInitials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser?.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isStudent ? 'var(--emerald)' : 'var(--primary)', fontWeight: 600 }}>
                        {currentUser?.role === 'hod'
                          ? 'Academic Leadership'
                          : isStudent
                          ? `PRN: ${currentUser?.roll_number}`
                          : 'Faculty Member'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser?.email}
                      </div>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div><strong>Institution:</strong> SIT Nagpur (SIU NAAC A++)</div>
                    <div><strong>Affiliation:</strong> {currentUser?.department || 'Computer Science & Engineering'}</div>
                  </div>

                  {/* Action Buttons: Switch Account & Sign Out */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem' }}
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onSwitchAccount();
                      }}
                    >
                      <ArrowLeftRight size={14} style={{ color: 'var(--primary)' }} />
                      <span>Switch Account (Open Login Screen)</span>
                    </button>

                    <button
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', color: 'var(--rose)', borderColor: 'var(--rose-border)' }}
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
