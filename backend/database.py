import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "marks_system.db"))

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('faculty', 'hod', 'student')),
            roll_number TEXT,
            username TEXT,
            department TEXT NOT NULL,
            avatar_url TEXT
        );
        """)
        # Auto-migration if column doesn't exist
        cursor.execute("PRAGMA table_info(users)")
        existing_cols = [c[1] for c in cursor.fetchall()]
        if "username" not in existing_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")

        
        # 2. Courses table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            semester TEXT NOT NULL,
            credits INTEGER DEFAULT 4,
            instructor_id TEXT NOT NULL,
            is_locked INTEGER DEFAULT 0,
            locked_at TEXT,
            locked_by TEXT,
            lock_reason TEXT,
            submission_status TEXT DEFAULT 'draft' CHECK(submission_status IN ('draft', 'submitted', 'locked', 'approved')),
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        );
        """)

        # 3. Component Groups (e.g. Tests: 40% Best 2 of 3; Assignments: 20%; Lab: 40%)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS component_groups (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            name TEXT NOT NULL,
            weightage_percent REAL NOT NULL,
            rule_type TEXT NOT NULL DEFAULT 'average' CHECK(rule_type IN ('average', 'best_n', 'weighted_sum', 'direct_sum')),
            best_n_count INTEGER DEFAULT 2,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
        """)

        # 4. Course Components (e.g. CIE 1, CIE 2, Assignment 1, Lab Practical)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS course_components (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            group_id TEXT NOT NULL,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            max_marks REAL NOT NULL,
            weightage_in_group REAL DEFAULT 1.0,
            is_locked INTEGER DEFAULT 0,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES component_groups(id) ON DELETE CASCADE
        );
        """)

        # 5. Course Enrollments
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(course_id, student_id),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 6. Marks Entries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS marks_entries (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            component_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            marks_obtained REAL,
            is_absent INTEGER DEFAULT 0,
            comments TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT NOT NULL,
            UNIQUE(component_id, student_id),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (component_id) REFERENCES course_components(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 7. Audit Trail / Change Log (For edit traceability & disputes)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mark_audit_logs (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            component_id TEXT NOT NULL,
            component_name TEXT NOT NULL,
            student_id TEXT NOT NULL,
            student_roll TEXT NOT NULL,
            student_name TEXT NOT NULL,
            old_value REAL,
            new_value REAL,
            old_status TEXT,
            new_status TEXT,
            changed_by_id TEXT NOT NULL,
            changed_by_name TEXT NOT NULL,
            changed_by_role TEXT NOT NULL,
            reason TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            source TEXT DEFAULT 'manual' CHECK(source IN ('manual', 'bulk_upload', 'revaluation', 'system'))
        );
        """)

        # 8. Revaluation / Grievance Requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS revaluation_requests (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            component_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            current_marks REAL,
            expected_marks REAL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            faculty_response TEXT,
            adjusted_marks REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT,
            resolved_by TEXT,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (component_id) REFERENCES course_components(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 9. Grade Scales / Cutoffs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS grade_cutoffs (
            id TEXT PRIMARY KEY,
            course_id TEXT,
            grade TEXT NOT NULL,
            grade_point INTEGER NOT NULL,
            min_percentage REAL NOT NULL,
            description TEXT NOT NULL,
            display_order INTEGER NOT NULL
        );
        """)
