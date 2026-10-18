import React from 'react';
import {
  FileSpreadsheet,
  Edit3,
  Sliders,
  BarChart3,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function NavigationTabs({ activeTab, onChangeTab, currentUser }) {
  const isStudent = currentUser?.role === 'student';

  // Distinct dedicated tabs for students vs faculty/HOD
  const tabs = isStudent
    ? [
        {
          id: 'student-marks',
          label: 'My Internal Marks & Breakdown',
          icon: Award,
          badge: 'Calculated'
        },
        {
          id: 'student-grievances',
          label: 'Grievance & Revaluations',
          icon: AlertCircle,
          badge: 'Disputes'
        },
        {
          id: 'syllabus',
          label: 'Course Syllabus & Outcomes',
          icon: BookOpen,
          badge: 'Curriculum'
        },
        {
          id: 'faculty',
          label: 'Faculty & Mentors Directory',
          icon: Users,
          badge: 'Contact'
        }
      ]
    : [
        {
          id: 'consolidated',
          label: 'Consolidated Master Sheet',
          icon: FileSpreadsheet,
          badge: 'Master View'
        },
        {
          id: 'matrix',
          label: 'Marks Entry Matrix',
          icon: Edit3,
          badge: 'Fast Entry'
        },
        {
          id: 'architect',
          label: 'Weightage & Rules',
          icon: Sliders,
          badge: 'Best-of-N'
        },
        {
          id: 'analytics',
          label: 'Class Analytics',
          icon: BarChart3,
          badge: 'Insights'
        },
        {
          id: 'inspector',
          label: 'Student Cohort Inspector',
          icon: GraduationCap,
          badge: 'Roster'
        },
        {
          id: 'syllabus',
          label: 'Curriculum & Syllabus Explorer',
          icon: BookOpen,
          badge: '61 Courses'
        },
        {
          id: 'faculty',
          label: 'Faculty Directory',
          icon: Users,
          badge: '28 Profiles'
        }
      ];

  return (
    <nav className="tabs-wrapper" aria-label="Main Navigation Tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChangeTab(tab.id)}
            role="tab"
            aria-selected={isActive}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                  color: isActive ? 'white' : 'var(--text-muted)'
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
