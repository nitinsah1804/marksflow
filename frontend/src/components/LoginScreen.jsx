import React, { useState, useEffect } from 'react';
import sitPhoto from '../assets/SIT_Photo.png';
import sitLogo from '../assets/SIT_Logo.png';
import {
  GraduationCap,
  Users,
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  Building2,
  BookOpen,
  LogIn,
  AlertCircle
} from 'lucide-react';

// Pre-defined fallback demo accounts to eliminate network latency or race conditions
const PRESET_DEMO_FACULTY = [
  {
    id: 'usr-dir-1',
    name: 'Prof. (Dr.) Nitin Rakesh',
    email: 'director@sitnagpur.siu.edu.in',
    role: 'hod',
    designation: 'Director & Senior Professor',
    department: 'Symbiosis Institute of Technology (SIT), Nagpur'
  },
  {
    id: 'usr-hod-1',
    name: 'Dr. Sagarkumar Shridhar Badhiye',
    email: 'hod.cse@sitnagpur.siu.edu.in',
    role: 'hod',
    designation: 'HOD (CSE) & Associate Professor',
    department: 'Department of Computer Science & Engineering, SIT Nagpur'
  },
  {
    id: 'usr-fac-22',
    name: 'Prof. Sarvat Ali',
    email: 'sarvat.ali@sitnagpur.siu.edu.in',
    role: 'faculty',
    designation: 'Course Incharge (TEE7300: C Prog)',
    department: 'Department of Computer Science & Engineering, SIT Nagpur'
  },
  {
    id: 'usr-fac-24',
    name: 'Prof. Ansar Isak Sheikh',
    email: 'ansar.sheikh@sitnagpur.siu.edu.in',
    role: 'faculty',
    designation: 'Course Incharge (TEE7305: Tinker Lab)',
    department: 'Department of Computer Science & Engineering, SIT Nagpur'
  },
  {
    id: 'usr-fac-1',
    name: 'Dr. Snehlata Wankhade',
    email: 'snehlata.wankhade@sitnagpur.siu.edu.in',
    role: 'faculty',
    designation: 'Faculty (T7908: Computer Networks)',
    department: 'Department of Computer Science & Engineering, SIT Nagpur'
  }
];

const PRESET_DEMO_STUDENTS = [
  {
    id: 'usr-stu-1',
    name: 'Disha Aher',
    email: 'disha.aher.batch2026@sitnagpur.siu.edu.in',
    role: 'student',
    roll_number: '26070521001',
    username: '26070521001',
    department: 'B.Tech Computer Science & Engineering (Batch 2026-30) · Section A'
  },
  {
    id: 'usr-stu-98',
    name: 'Anuj Sanju Agrawal',
    email: 'anuj.agrawal.batch2026@sitnagpur.siu.edu.in',
    role: 'student',
    roll_number: '26070521091',
    username: '26070521091',
    department: 'B.Tech Computer Science & Engineering (Batch 2026-30) · Section B'
  },
  {
    id: 'usr-stu-161',
    name: 'Nitinkumar Sah',
    email: 'nitinkumar.sah.batch2026@sitnagpur.siu.edu.in',
    role: 'student',
    roll_number: '26070521143',
    username: '26070521143',
    department: 'B.Tech Computer Science & Engineering (Batch 2026-30) · Section C'
  },
  {
    id: 'usr-stu-208',
    name: 'Vishesh Chandrashekhar Dawande',
    email: 'vishesh.dawande.batch2026@sitnagpur.siu.edu.in',
    role: 'student',
    roll_number: '26070521181',
    username: '26070521181',
    department: 'B.Tech Computer Science & Engineering (Batch 2026-30) · Section D'
  },
  {
    id: 'usr-stu-278',
    name: 'Zaima Wasiq Ur Rahim',
    email: 'zaima.rahim.batch2026@sitnagpur.siu.edu.in',
    role: 'student',
    roll_number: '26070521241',
    username: '26070521241',
    department: 'B.Tech Computer Science & Engineering (Batch 2026-30) · Section E'
  }
];

export default function LoginScreen({
  users = [],
  onLogin,
  theme,
  onToggleTheme,
  showToast
}) {
  const [activePortal, setActivePortal] = useState('faculty'); // 'faculty' or 'student'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [localUsers, setLocalUsers] = useState(users);

  // If passed users is empty, fetch immediately
  useEffect(() => {
    if (users && users.length > 0) {
      setLocalUsers(users);
    } else {
      fetch('/api/users')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLocalUsers(data);
          }
        })
        .catch((err) => console.error('Failed to load users for login:', err));
    }
  }, [users]);

  // Combine fetched users with fallback presets
  const facultyList = localUsers.filter((u) => u.role === 'faculty' || u.role === 'hod');
  const studentList = localUsers.filter((u) => u.role === 'student');

  // Instant 1-Click login from demo badge
  const handleInstantLogin = (demoUser) => {
    setErrorMessage('');
    // Try to find exact user in full database or fallback to preset
    const fullUser =
      localUsers.find(
        (u) =>
          u.id === demoUser.id ||
          (u.roll_number && u.roll_number === demoUser.roll_number) ||
          u.email.toLowerCase() === demoUser.email.toLowerCase()
      ) || demoUser;

    if (showToast) {
      showToast(`Authenticated as ${fullUser.name} (${fullUser.role.toUpperCase()})`, 'success');
    }
    onLogin(fullUser);
  };

  // Pre-fill form from demo badge
  const handlePrefillDemo = (demoUser) => {
    if (demoUser.role === 'student') {
      setIdentifier(demoUser.roll_number || demoUser.email);
    } else {
      setIdentifier(demoUser.email);
    }
    setPassword('sit@nagpur2026');
    setErrorMessage('');
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const idTrimmed = identifier.trim().toLowerCase();

    if (!idTrimmed) {
      setErrorMessage(
        activePortal === 'faculty'
          ? 'Please enter your institutional email (or click a quick login account below).'
          : 'Please enter your PRN or email (or click a quick student account below).'
      );
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      let matched = null;

      if (activePortal === 'faculty') {
        const sourceFaculty = facultyList.length > 0 ? facultyList : PRESET_DEMO_FACULTY;
        matched = sourceFaculty.find(
          (u) =>
            u.email.toLowerCase() === idTrimmed ||
            u.id.toLowerCase() === idTrimmed ||
            u.name.toLowerCase().includes(idTrimmed)
        );
      } else {
        const sourceStudents = studentList.length > 0 ? studentList : PRESET_DEMO_STUDENTS;
        matched = sourceStudents.find(
          (u) =>
            (u.roll_number && u.roll_number.toLowerCase() === idTrimmed) ||
            u.email.toLowerCase() === idTrimmed ||
            u.email.split('@')[0].toLowerCase() === idTrimmed ||
            (u.username && u.username.toLowerCase() === idTrimmed) ||
            u.id.toLowerCase() === idTrimmed ||
            u.name.toLowerCase().includes(idTrimmed)
        );
      }

      setSubmitting(false);

      if (matched) {
        if (showToast) {
          showToast(`Welcome back, ${matched.name}!`, 'success');
        }
        onLogin(matched);
      } else {
        setErrorMessage(
          activePortal === 'faculty'
            ? 'No faculty member found with this email. Try clicking one of the 1-Click Demo Profiles below.'
            : 'No student found with this username. Enter your 11-digit PRN (e.g. 26070521001) or college email (e.g. disha.aher.batch2026@sitnagpur.siu.edu.in).'
        );
      }
    }, 250);
  };

  return (
    <div
      className="login-screen-wrapper"
      style={{
        backgroundImage: `url(${sitPhoto})`
      }}
    >
      {/* Background cinematic vignette overlay */}
      <div className="login-backdrop-overlay" />

      {/* Top Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}>
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* Main Login Card with Frosted Glassmorphism */}
      <div className="login-card-glass">
        {/* University Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              margin: '0 auto 1.15rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <img
              src={sitLogo}
              alt="Symbiosis SIT Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            SIT Nagpur <span style={{ color: 'var(--primary)' }}>MarksFlow</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
            Symbiosis Institute of Technology &bull; SIU (NAAC A++)
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
              <ShieldCheck size={12} /> Unified Examination &amp; Evaluation Platform
            </span>
          </div>
        </div>

        {/* Portal Switcher Tabs: Faculty vs Student */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activePortal === 'faculty' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.825rem',
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}
            onClick={() => {
              setActivePortal('faculty');
              setIdentifier('');
              setErrorMessage('');
            }}
          >
            <Users size={16} /> Faculty &amp; Leadership
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activePortal === 'student' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.825rem',
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}
            onClick={() => {
              setActivePortal('student');
              setIdentifier('');
              setErrorMessage('');
            }}
          >
            <GraduationCap size={16} /> Student Portal (2026-30)
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: 'var(--rose-light)',
                border: '1px solid var(--rose-border)',
                color: 'var(--rose)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {activePortal === 'faculty' ? 'Institutional Email' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              {activePortal === 'faculty' ? (
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              ) : (
                <Building2 size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              )}
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder={activePortal === 'faculty' ? 'Enter your institutional email' : 'Enter your username'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', right: '0.35rem', top: '50%', transform: 'translateY(-50%)', padding: '0.25rem', height: 'auto' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : `Sign In to ${activePortal === 'faculty' ? 'Faculty' : 'Student'} Portal`}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Instant Demo Access Shortcuts */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1-Click Demo Profiles (Instant Sign In)
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              <Sparkles size={11} /> Ready to Test
            </span>
          </div>

          <div className="demo-profiles-list">
            {(activePortal === 'faculty' ? PRESET_DEMO_FACULTY : PRESET_DEMO_STUDENTS).map((d) => (
              <div key={d.id} className="demo-profile-item">
                <div className="demo-profile-info">
                  <div className="demo-profile-name">
                    {d.name}
                  </div>
                  <div className="demo-profile-sub">
                    {d.role === 'student'
                      ? `PRN: ${d.roll_number} · Section ${d.department.includes('Section') ? d.department.split('Section')[1].trim() : 'C'}`
                      : d.designation}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    style={{ fontWeight: 700, fontSize: '0.75rem', padding: '0.32rem 0.6rem' }}
                    onClick={() => handleInstantLogin(d)}
                    title={`Instantly sign in as ${d.name}`}
                  >
                    <LogIn size={12} /> Login
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    style={{ fontSize: '0.75rem', padding: '0.32rem 0.5rem' }}
                    onClick={() => handlePrefillDemo(d)}
                    title="Fill credentials into input field"
                  >
                    Fill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Regulatory Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Symbiosis International (Deemed University) &bull; SIT Nagpur Academic Records Cell
        </div>
      </div>

      {/* Campus Photo Caption / Landmark Badge */}
      <div className="login-campus-caption">
        <Building2 size={13} style={{ color: 'var(--primary)' }} />
        <span>Symbiosis Institute of Technology (SIT), Nagpur Campus</span>
      </div>
    </div>
  );
}
