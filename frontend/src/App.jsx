import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NavigationTabs from './components/NavigationTabs';
import ConsolidatedMasterSheet from './components/ConsolidatedMasterSheet';
import MarksEntryMatrix from './components/MarksEntryMatrix';
import WeightageArchitect from './components/WeightageArchitect';
import ClassAnalytics from './components/ClassAnalytics';
import StudentCohortInspector from './components/StudentCohortInspector';
import StudentPortal from './components/StudentPortal';
import StudentGrievanceCenter from './components/StudentGrievanceCenter';
import AppearanceModal from './components/AppearanceModal';
import AuditLogModal from './components/AuditLogModal';
import RevaluationManagerModal from './components/RevaluationManagerModal';
import LockModal from './components/LockModal';
import GradeCutoffsModal from './components/GradeCutoffsModal';
import NewCourseModal from './components/NewCourseModal';
import StudentDetailModal from './components/StudentDetailModal';
import FacultyDirectory from './components/FacultyDirectory';
import SyllabusExplorer from './components/SyllabusExplorer';
import LoginScreen from './components/LoginScreen';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // Appearance & Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('marksflow_theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('marksflow_accent') || 'sapphire');
  const [density, setDensity] = useState(() => localStorage.getItem('marksflow_density') || 'comfortable');
  const [detailLevel, setDetailLevel] = useState(() => localStorage.getItem('marksflow_detail_level') || 'minimal');
  const [animations, setAnimations] = useState(() => ({
    enabled: localStorage.getItem('marksflow_anim_enabled') !== 'false',
    tabTransitions: localStorage.getItem('marksflow_anim_tabs') !== 'false',
    hoverEffects: localStorage.getItem('marksflow_anim_hover') !== 'false',
    badgePulse: localStorage.getItem('marksflow_anim_pulse') !== 'false'
  }));

  const toggleDetails = () => {
    setDetailLevel((prev) => (prev === 'minimal' ? 'detailed' : 'minimal'));
  };

  // Core Application State
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('consolidated');
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [groupsData, setGroupsData] = useState(null);
  const [pendingGrievancesCount, setPendingGrievancesCount] = useState(0);

  // Modals State
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [revaluationOpen, setRevaluationOpen] = useState(false);
  const [gradeCutoffsOpen, setGradeCutoffsOpen] = useState(false);
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [detailStudentRow, setDetailStudentRow] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Apply Theme & Attributes to Root DOM
  useEffect(() => {
    localStorage.setItem('marksflow_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('marksflow_accent', accent);
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('marksflow_density', density);
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('marksflow_detail_level', detailLevel);
    document.documentElement.setAttribute('data-details', detailLevel);
  }, [detailLevel]);

  useEffect(() => {
    localStorage.setItem('marksflow_anim_enabled', animations.enabled);
    localStorage.setItem('marksflow_anim_tabs', animations.tabTransitions);
    localStorage.setItem('marksflow_anim_hover', animations.hoverEffects);
    localStorage.setItem('marksflow_anim_pulse', animations.badgePulse);

    document.documentElement.setAttribute('data-animations', animations.enabled ? 'full' : 'none');
    document.documentElement.setAttribute('data-anim-tabs', animations.tabTransitions ? 'true' : 'false');
    document.documentElement.setAttribute('data-anim-hover', animations.hoverEffects ? 'true' : 'false');
    document.documentElement.setAttribute('data-anim-pulse', animations.badgePulse ? 'true' : 'false');
  }, [animations]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load Course and Groups data
  const loadCourseFullData = useCallback(async (courseId) => {
    if (!courseId) return;
    try {
      const [cRes, gRes, rRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/consolidated`),
        fetch(`/api/courses/${courseId}/groups`),
        fetch(`/api/courses/${courseId}/revaluations`)
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setConsolidatedData(cData);
      }

      if (gRes.ok) {
        const gData = await gRes.json();
        setGroupsData(gData);
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        const pending = rData.filter((r) => r.status === 'pending').length;
        setPendingGrievancesCount(pending);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    }
  }, []);

  // Fetch relevant courses depending on active user role
  const loadCoursesForUser = useCallback(async (user) => {
    if (!user) return;
    try {
      if (user.role === 'student') {
        // Fetch only courses this student is enrolled in
        const res = await fetch(`/api/student/${user.id}/courses`);
        if (res.ok) {
          const studentCourses = await res.json();
          setCourses(studentCourses);
          if (studentCourses.length > 0) {
            setCurrentCourse(studentCourses[0]);
            loadCourseFullData(studentCourses[0].id);
          }
        }
      } else {
        // Teacher / HOD: fetch all courses
        const res = await fetch('/api/courses');
        if (res.ok) {
          const allCourses = await res.json();
          setCourses(allCourses);
          if (allCourses.length > 0) {
            setCurrentCourse(allCourses[0]);
            loadCourseFullData(allCourses[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load courses for user:', err);
    }
  }, [loadCourseFullData]);

  // Initial Data Fetch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const uRes = await fetch('/api/users');
        if (uRes.ok) {
          const loadedUsers = await uRes.json();
          setUsers(loadedUsers);
          const savedUserId = localStorage.getItem('marksflow_auth_user_id');
          if (savedUserId) {
            const found = loadedUsers.find((u) => u.id === savedUserId);
            if (found) {
              setCurrentUser(found);
              loadCoursesForUser(found);
              if (found.role === 'student') {
                setActiveTab('student-marks');
              } else {
                setActiveTab('consolidated');
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Error initializing application data', 'error');
      }
    };

    initializeApp();
  }, [loadCoursesForUser, showToast]);

  // Handle Switch Course
  const handleSelectCourse = (course) => {
    setCurrentCourse(course);
    loadCourseFullData(course.id);
  };

  // Auth Handlers: Login, Logout, Switch Account
  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('marksflow_auth_user_id', user.id);
    loadCoursesForUser(user);
    if (user.role === 'student') {
      setActiveTab('student-marks');
    } else {
      setActiveTab('consolidated');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('marksflow_auth_user_id');
    showToast('Signed out of academic session', 'info');
  };

  const handleSwitchAccount = () => {
    setCurrentUser(null);
    localStorage.removeItem('marksflow_auth_user_id');
    showToast('Choose an account to sign in', 'info');
  };

  // Submit to HOD
  const handleSubmitToHOD = async () => {
    if (!currentCourse) return;
    try {
      const res = await fetch(`/api/courses/${currentCourse.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 'usr-fac-1',
          user_name: currentUser?.name || 'Faculty Instructor',
          user_role: currentUser?.role || 'faculty',
          reason: 'Course internal marks compiled and submitted to HOD for final moderation.'
        })
      });

      if (!res.ok) throw new Error('Submission failed');

      showToast('Internal marks submitted to HOD successfully!', 'success');
      loadCourseFullData(currentCourse.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Structure groups with embedded components for WeightageArchitect
  const architectGroups = (groupsData?.groups || []).map((grp) => ({
    ...grp,
    components: (groupsData?.components || []).filter((c) => c.group_id === grp.id)
  }));

  // Flat components list for Marks Entry Matrix
  const componentsList = groupsData?.components || [];

  // Students list
  const studentsList = consolidatedData?.students?.map((s) => ({
    id: s.student_id,
    name: s.student_name,
    roll_number: s.roll_number,
    email: s.email
  })) || [];

  // If unauthenticated, show LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
        showToast={showToast}
      />
    );
  }

  const isStudent = currentUser.role === 'student';

  return (
    <div className="app-wrapper">
      {/* 1. Header / Navbar */}
      <Navbar
        courses={courses}
        currentCourse={currentCourse}
        onSelectCourse={handleSelectCourse}
        currentUser={currentUser}
        onSwitchAccount={handleSwitchAccount}
        onLogout={handleLogout}
        onOpenLockModal={!isStudent ? () => setLockModalOpen(true) : undefined}
        onOpenAuditLog={!isStudent ? () => setAuditLogOpen(true) : undefined}
        onOpenRevaluationModal={!isStudent ? () => setRevaluationOpen(true) : undefined}
        onOpenGradeCutoffs={!isStudent ? () => setGradeCutoffsOpen(true) : undefined}
        onOpenNewCourse={!isStudent ? () => setNewCourseOpen(true) : undefined}
        onOpenAppearance={() => setAppearanceOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        detailLevel={detailLevel}
        pendingGrievancesCount={pendingGrievancesCount}
      />

      {/* 2. Main Container */}
      <main className="main-content">
        {/* Navigation Tabs (Distinct for Students vs Teachers) */}
        <NavigationTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          currentUser={currentUser}
        />

        {/* ============================================================== */}
        {/* STUDENT VIEWS ONLY (Zero teacher tools visible) */}
        {/* ============================================================== */}
        {isStudent && activeTab === 'student-marks' && (
          <StudentPortal
            currentCourse={currentCourse}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {isStudent && activeTab === 'student-grievances' && (
          <StudentGrievanceCenter
            currentCourse={currentCourse}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* ============================================================== */}
        {/* TEACHER VIEWS ONLY (Master Sheet, Matrix, Weightage, Analytics, Cohort Inspector) */}
        {/* ============================================================== */}
        {!isStudent && activeTab === 'consolidated' && (
          <ConsolidatedMasterSheet
            consolidatedData={consolidatedData}
            groupsData={groupsData}
            currentCourse={currentCourse}
            currentUser={currentUser}
            onSubmitToHOD={handleSubmitToHOD}
            onOpenGradeCutoffs={() => setGradeCutoffsOpen(true)}
            onSelectStudent={(row) => setDetailStudentRow(row)}
          />
        )}

        {!isStudent && activeTab === 'matrix' && (
          <MarksEntryMatrix
            currentCourse={currentCourse}
            currentUser={currentUser}
            componentsList={componentsList}
            onMarksSaved={() => currentCourse && loadCourseFullData(currentCourse.id)}
            showToast={showToast}
          />
        )}

        {!isStudent && activeTab === 'architect' && (
          <WeightageArchitect
            groups={architectGroups}
            currentCourse={currentCourse}
            currentUser={currentUser}
            onRefresh={() => currentCourse && loadCourseFullData(currentCourse.id)}
            showToast={showToast}
          />
        )}

        {!isStudent && activeTab === 'analytics' && (
          <ClassAnalytics
            consolidatedData={consolidatedData}
            currentCourse={currentCourse}
            onSelectStudent={(row) => setDetailStudentRow(row)}
          />
        )}

        {!isStudent && activeTab === 'inspector' && (
          <StudentCohortInspector
            currentCourse={currentCourse}
            currentUser={currentUser}
            studentsList={studentsList}
            onOpenRevaluationModal={() => setRevaluationOpen(true)}
            showToast={showToast}
          />
        )}

        {/* ============================================================== */}
        {/* GENERAL CATALOGS (Curriculum Syllabus & Faculty Directory) */}
        {/* ============================================================== */}
        {activeTab === 'syllabus' && (
          <SyllabusExplorer showToast={showToast} />
        )}

        {activeTab === 'faculty' && (
          <FacultyDirectory
            currentUser={currentUser}
            showToast={showToast}
          />
        )}
      </main>

      {/* 3. Modals */}
      {/* Appearance Modal is accessible to everyone */}
      <AppearanceModal
        isOpen={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        theme={theme}
        setTheme={setTheme}
        accent={accent}
        setAccent={setAccent}
        density={density}
        setDensity={setDensity}
        detailLevel={detailLevel}
        setDetailLevel={setDetailLevel}
        animations={animations}
        setAnimations={setAnimations}
      />

      {/* TEACHER-ONLY GOVERNANCE MODALS (Never rendered in Student DOM) */}
      {!isStudent && (
        <>
          <AuditLogModal
            isOpen={auditLogOpen}
            onClose={() => setAuditLogOpen(false)}
            currentCourse={currentCourse}
          />

          <RevaluationManagerModal
            isOpen={revaluationOpen}
            onClose={() => setRevaluationOpen(false)}
            currentCourse={currentCourse}
            currentUser={currentUser}
            onResolved={() => currentCourse && loadCourseFullData(currentCourse.id)}
            showToast={showToast}
          />

          <LockModal
            isOpen={lockModalOpen}
            onClose={() => setLockModalOpen(false)}
            currentCourse={currentCourse}
            currentUser={currentUser}
            onStatusChanged={() => currentCourse && loadCourseFullData(currentCourse.id)}
            showToast={showToast}
          />

          <GradeCutoffsModal
            isOpen={gradeCutoffsOpen}
            onClose={() => setGradeCutoffsOpen(false)}
            currentCourse={currentCourse}
            onCutoffsUpdated={() => currentCourse && loadCourseFullData(currentCourse.id)}
            showToast={showToast}
          />

          <NewCourseModal
            isOpen={newCourseOpen}
            onClose={() => setNewCourseOpen(false)}
            currentUser={currentUser}
            onCourseCreated={(newC) => {
              setCourses((prev) => [...prev, newC]);
              setCurrentCourse(newC);
              loadCourseFullData(newC.id);
            }}
            showToast={showToast}
          />

          <StudentDetailModal
            studentRow={detailStudentRow}
            onClose={() => setDetailStudentRow(null)}
          />
        </>
      )}

      {/* 4. Global Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${
              t.type === 'success'
                ? 'toast-success'
                : t.type === 'error'
                ? 'toast-error'
                : 'toast-info'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
            ) : t.type === 'error' ? (
              <AlertCircle size={18} style={{ color: 'var(--rose)', flexShrink: 0 }} />
            ) : (
              <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>{t.message}</div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => removeToast(t.id)}
              style={{ padding: '0.1rem' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
