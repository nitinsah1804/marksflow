import os
import json
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_db, init_db
from calculation_engine import calculate_consolidated_sheet, calculate_student_breakdown
from excel_service import (
    create_component_template_excel,
    parse_component_upload,
    generate_consolidated_master_excel
)
from seed_data import seed_all

app = FastAPI(title="Internal Marks Compilation System API", version="2.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_all()

# --- Pydantic Request Models ---
class CourseCreate(BaseModel):
    code: str
    title: str
    department: str
    semester: str
    credits: int = 4
    instructor_id: str

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    credits: Optional[int] = None

class CourseLockRequest(BaseModel):
    user_id: str
    user_name: str
    user_role: str
    reason: str

class CourseUnlockRequest(BaseModel):
    user_id: str
    user_name: str
    user_role: str
    reason: str

class GroupCreate(BaseModel):
    name: str
    weightage_percent: float
    rule_type: str = "average" # 'average', 'best_n', 'direct_sum'
    best_n_count: Optional[int] = 2
    description: Optional[str] = ""

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    weightage_percent: Optional[float] = None
    rule_type: Optional[str] = None
    best_n_count: Optional[int] = None
    description: Optional[str] = None

class ComponentCreate(BaseModel):
    group_id: str
    name: str
    code: str
    max_marks: float
    due_date: Optional[str] = None

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    max_marks: Optional[float] = None
    due_date: Optional[str] = None

class SingleMarkUpdate(BaseModel):
    student_id: str
    marks_obtained: Optional[float] = None
    is_absent: bool = False
    comments: Optional[str] = ""
    changed_by_id: str
    changed_by_name: str
    changed_by_role: str
    reason: str

class BulkMarksItem(BaseModel):
    student_id: str
    marks_obtained: Optional[float] = None
    is_absent: bool = False
    comments: Optional[str] = ""

class BulkMarksSave(BaseModel):
    entries: List[BulkMarksItem]
    changed_by_id: str
    changed_by_name: str
    changed_by_role: str
    reason: str

class RevaluationCreate(BaseModel):
    course_id: str
    component_id: str
    student_id: str
    current_marks: Optional[float]
    expected_marks: Optional[float]
    reason: str

class RevaluationResolve(BaseModel):
    status: str # 'approved', 'rejected'
    faculty_response: str
    adjusted_marks: Optional[float] = None
    resolved_by_id: str
    resolved_by_name: str
    resolved_by_role: str

class GradeCutoffItem(BaseModel):
    grade: str
    grade_point: int
    min_percentage: float
    description: str

class GradeCutoffsUpdate(BaseModel):
    cutoffs: List[GradeCutoffItem]


# ==========================================
# 1. USER & PROFILE ENDPOINTS
# ==========================================
@app.get("/api/users")
def get_users():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY role DESC, name ASC")
        return [dict(row) for row in cursor.fetchall()]

@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(row)

@app.post("/api/auth/login")
def login(payload: Dict[str, Any]):
    identifier = payload.get("identifier", "").strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM users 
            WHERE LOWER(roll_number) = ? 
               OR LOWER(email) = ? 
               OR LOWER(username) = ? 
               OR LOWER(id) = ?
               OR LOWER(name) = ?
        """, (identifier, identifier, identifier, identifier, identifier))
        row = cursor.fetchone()
        if not row:
            # Also try matching email username prefix before @
            cursor.execute("SELECT * FROM users WHERE LOWER(email) LIKE ?", (f"{identifier}@%",))
            row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(row)

@app.get("/api/faculty")
def get_faculty_profiles():
    """Returns rich faculty and academic leadership profiles parsed from SIT Nagpur portal pages."""
    try:
        profiles_path = os.path.join(os.path.dirname(__file__), "faculty_profiles_full.json")
        with open(profiles_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE role IN ('faculty', 'hod') ORDER BY name ASC")
            return [dict(row) for row in cursor.fetchall()]

@app.get("/api/faculty/{faculty_id}")
def get_faculty_profile(faculty_id: str):
    """Returns full profile and research dossier for a single faculty member."""
    try:
        profiles_path = os.path.join(os.path.dirname(__file__), "faculty_profiles_full.json")
        with open(profiles_path, "r", encoding="utf-8") as f:
            profiles = json.load(f)
            for p in profiles:
                if p["id"] == faculty_id:
                    return p
    except Exception:
        pass
    raise HTTPException(status_code=404, detail="Faculty profile not found")

@app.get("/api/syllabus/courses")
def get_syllabus_courses():
    """Returns official syllabus catalog parsed from Syllabus Files for Session ODD 2026-27."""
    try:
        path = os.path.join(os.path.dirname(__file__), "syllabus_courses.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


# ==========================================
# 2. COURSES ENDPOINTS
# ==========================================
@app.get("/api/courses")
def get_courses():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.name as instructor_name, u.email as instructor_email,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count,
            (SELECT COUNT(*) FROM course_components WHERE course_id = c.id) as component_count,
            (SELECT COALESCE(SUM(weightage_percent), 0) FROM component_groups WHERE course_id = c.id) as total_weightage
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            ORDER BY c.code ASC
        """)
        return [dict(row) for row in cursor.fetchall()]

@app.get("/api/courses/{course_id}")
def get_course_detail(course_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.name as instructor_name, u.email as instructor_email,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count,
            (SELECT COALESCE(SUM(weightage_percent), 0) FROM component_groups WHERE course_id = c.id) as total_weightage
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ?
        """, (course_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Course not found")
        return dict(row)

@app.post("/api/courses")
def create_course(payload: CourseCreate):
    course_id = f"crs-{uuid.uuid4().hex[:8]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO courses (id, code, title, department, semester, credits, instructor_id, submission_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
        """, (course_id, payload.code, payload.title, payload.department, payload.semester, payload.credits, payload.instructor_id))
        
        # Automatically copy default grade cutoffs for this course
        cursor.execute("SELECT * FROM grade_cutoffs WHERE course_id IS NULL ORDER BY display_order ASC")
        default_cutoffs = cursor.fetchall()
        for gc in default_cutoffs:
            cursor.execute("""
                INSERT INTO grade_cutoffs (id, course_id, grade, grade_point, min_percentage, description, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (f"gc-{uuid.uuid4().hex[:8]}", course_id, gc["grade"], gc["grade_point"], gc["min_percentage"], gc["description"], gc["display_order"]))

        # Automatically enroll sample students for demonstration
        cursor.execute("SELECT id FROM users WHERE role = 'student'")
        students = cursor.fetchall()
        for s in students:
            cursor.execute("INSERT INTO enrollments (id, course_id, student_id) VALUES (?, ?, ?)",
                           (f"enr-{uuid.uuid4().hex[:8]}", course_id, s["id"]))

    return {"id": course_id, "message": "Course created successfully with default grade scales & student enrollments"}

@app.post("/api/courses/{course_id}/submit")
def submit_course_marks(course_id: str, payload: CourseLockRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_locked, submission_status FROM courses WHERE id = ?", (course_id,))
        c = cursor.fetchone()
        if not c:
            raise HTTPException(status_code=404, detail="Course not found")
        if c["is_locked"]:
            raise HTTPException(status_code=400, detail="Course is already locked")

        cursor.execute("""
            UPDATE courses
            SET submission_status = 'submitted'
            WHERE id = ?
        """, (course_id,))

        # Add audit log
        cursor.execute("""
            INSERT INTO mark_audit_logs (id, course_id, component_id, component_name, student_id, student_roll, student_name,
                                         old_value, new_value, old_status, new_status, changed_by_id, changed_by_name, changed_by_role, reason, source)
            VALUES (?, ?, 'SYSTEM', 'Course Submission', 'ALL', 'ALL', 'All Students', NULL, NULL, 'draft', 'submitted',
                    ?, ?, ?, ?, 'system')
        """, (f"aud-{uuid.uuid4().hex[:8]}", course_id, payload.user_id, payload.user_name, payload.user_role, payload.reason))

    return {"message": "Marks submitted to HOD/Exam Coordinator for review"}

@app.post("/api/courses/{course_id}/lock")
def lock_course(course_id: str, payload: CourseLockRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
        c = cursor.fetchone()
        if not c:
            raise HTTPException(status_code=404, detail="Course not found")
        
        cursor.execute("""
            UPDATE courses
            SET is_locked = 1,
                locked_at = CURRENT_TIMESTAMP,
                locked_by = ?,
                lock_reason = ?,
                submission_status = 'locked'
            WHERE id = ?
        """, (f"{payload.user_name} ({payload.user_role.upper()})", payload.reason, course_id))

        # Also lock all components
        cursor.execute("UPDATE course_components SET is_locked = 1 WHERE course_id = ?", (course_id,))

        cursor.execute("""
            INSERT INTO mark_audit_logs (id, course_id, component_id, component_name, student_id, student_roll, student_name,
                                         old_value, new_value, old_status, new_status, changed_by_id, changed_by_name, changed_by_role, reason, source)
            VALUES (?, ?, 'SYSTEM', 'Course Freeze', 'ALL', 'ALL', 'All Students', NULL, NULL, 'unlocked', 'locked',
                    ?, ?, ?, ?, 'system')
        """, (f"aud-{uuid.uuid4().hex[:8]}", course_id, payload.user_id, payload.user_name, payload.user_role, f"FREEZE LOCKED: {payload.reason}"))

    return {"message": "Course marks successfully locked and frozen"}

@app.post("/api/courses/{course_id}/unlock")
def unlock_course(course_id: str, payload: CourseUnlockRequest):
    # Only HOD or coordinator can unlock
    if payload.user_role.lower() not in ("hod", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only HOD or Exam Coordinator is authorized to unlock frozen marks.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE courses
            SET is_locked = 0,
                locked_at = NULL,
                locked_by = NULL,
                lock_reason = NULL,
                submission_status = 'draft'
            WHERE id = ?
        """, (course_id,))

        cursor.execute("UPDATE course_components SET is_locked = 0 WHERE course_id = ?", (course_id,))

        cursor.execute("""
            INSERT INTO mark_audit_logs (id, course_id, component_id, component_name, student_id, student_roll, student_name,
                                         old_value, new_value, old_status, new_status, changed_by_id, changed_by_name, changed_by_role, reason, source)
            VALUES (?, ?, 'SYSTEM', 'Course Unfreeze', 'ALL', 'ALL', 'All Students', NULL, NULL, 'locked', 'draft',
                    ?, ?, ?, ?, 'system')
        """, (f"aud-{uuid.uuid4().hex[:8]}", course_id, payload.user_id, payload.user_name, payload.user_role, f"UNFREEZE REASON: {payload.reason}"))

    return {"message": "Course marks unlocked for authorized edits"}


# ==========================================
# 3. COMPONENT GROUPS & WEIGHTAGES
# ==========================================
@app.get("/api/courses/{course_id}/groups")
def get_course_groups(course_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT g.*, 
            (SELECT COUNT(*) FROM course_components WHERE group_id = g.id) as component_count
            FROM component_groups g
            WHERE g.course_id = ?
            ORDER BY g.display_order ASC
        """, (course_id,))
        groups = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT * FROM course_components WHERE course_id = ? ORDER BY due_date ASC, code ASC
        """, (course_id,))
        comps = [dict(row) for row in cursor.fetchall()]

        total_weight = sum(g["weightage_percent"] for g in groups)

        return {
            "groups": groups,
            "components": comps,
            "total_weightage": total_weight,
            "is_valid_100": (abs(total_weight - 100.0) < 0.01)
        }

@app.post("/api/courses/{course_id}/groups")
def create_group(course_id: str, payload: GroupCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (course_id,))
        c = cursor.fetchone()
        if c and c["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot add groups to a locked course")

        gid = f"grp-{uuid.uuid4().hex[:8]}"
        cursor.execute("SELECT COALESCE(MAX(display_order), 0) + 1 as next_ord FROM component_groups WHERE course_id = ?", (course_id,))
        next_ord = cursor.fetchone()["next_ord"]

        cursor.execute("""
            INSERT INTO component_groups (id, course_id, name, weightage_percent, rule_type, best_n_count, description, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (gid, course_id, payload.name, payload.weightage_percent, payload.rule_type, payload.best_n_count, payload.description, next_ord))

    return {"id": gid, "message": "Component group added"}

@app.put("/api/groups/{group_id}")
def update_group(group_id: str, payload: GroupUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT course_id FROM component_groups WHERE id = ?", (group_id,))
        g = cursor.fetchone()
        if not g:
            raise HTTPException(status_code=404, detail="Group not found")
        
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (g["course_id"],))
        c = cursor.fetchone()
        if c and c["is_locked"]:
            raise HTTPException(status_code=400, detail="Course is locked. Unlock to modify weightage rules.")

        fields = []
        vals = []
        if payload.name is not None:
            fields.append("name = ?"); vals.append(payload.name)
        if payload.weightage_percent is not None:
            fields.append("weightage_percent = ?"); vals.append(payload.weightage_percent)
        if payload.rule_type is not None:
            fields.append("rule_type = ?"); vals.append(payload.rule_type)
        if payload.best_n_count is not None:
            fields.append("best_n_count = ?"); vals.append(payload.best_n_count)
        if payload.description is not None:
            fields.append("description = ?"); vals.append(payload.description)

        if fields:
            vals.append(group_id)
            cursor.execute(f"UPDATE component_groups SET {', '.join(fields)} WHERE id = ?", vals)

    return {"message": "Group updated successfully"}

@app.delete("/api/groups/{group_id}")
def delete_group(group_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT course_id FROM component_groups WHERE id = ?", (group_id,))
        g = cursor.fetchone()
        if not g:
            raise HTTPException(status_code=404, detail="Group not found")
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (g["course_id"],))
        c = cursor.fetchone()
        if c and c["is_locked"]:
            raise HTTPException(status_code=400, detail="Course is locked")

        cursor.execute("DELETE FROM component_groups WHERE id = ?", (group_id,))

    return {"message": "Group deleted"}


# ==========================================
# 4. COMPONENTS (e.g. CIE-1, Assignment 1)
# ==========================================
@app.post("/api/courses/{course_id}/components")
def create_component(course_id: str, payload: ComponentCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (course_id,))
        c = cursor.fetchone()
        if c and c["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot modify a locked course")

        cid = f"cmp-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO course_components (id, course_id, group_id, name, code, max_marks, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (cid, course_id, payload.group_id, payload.name, payload.code, payload.max_marks, payload.due_date))

    return {"id": cid, "message": "Component created"}

@app.put("/api/components/{component_id}")
def update_component(component_id: str, payload: ComponentUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT course_id, is_locked FROM course_components WHERE id = ?", (component_id,))
        c = cursor.fetchone()
        if not c:
            raise HTTPException(status_code=404, detail="Component not found")
        if c["is_locked"]:
            raise HTTPException(status_code=400, detail="Component is locked")

        fields = []
        vals = []
        if payload.name is not None:
            fields.append("name = ?"); vals.append(payload.name)
        if payload.code is not None:
            fields.append("code = ?"); vals.append(payload.code)
        if payload.max_marks is not None:
            fields.append("max_marks = ?"); vals.append(payload.max_marks)
        if payload.due_date is not None:
            fields.append("due_date = ?"); vals.append(payload.due_date)

        if fields:
            vals.append(component_id)
            cursor.execute(f"UPDATE course_components SET {', '.join(fields)} WHERE id = ?", vals)

    return {"message": "Component updated"}

@app.delete("/api/components/{component_id}")
def delete_component(component_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM course_components WHERE id = ?", (component_id,))
    return {"message": "Component deleted"}


# ==========================================
# 5. MARKS ENTRY, AUDIT LOGGING & BULK UPLOAD
# ==========================================
@app.get("/api/components/{component_id}/marks")
def get_component_marks(component_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cc.*, cg.name as group_name, cg.rule_type, cg.best_n_count,
                   c.code as course_code, c.title as course_title, c.is_locked as course_locked
            FROM course_components cc
            JOIN component_groups cg ON cc.group_id = cg.id
            JOIN courses c ON cc.course_id = c.id
            WHERE cc.id = ?
        """, (component_id,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Component not found")

        # Get enrolled students and their current marks
        cursor.execute("""
            SELECT u.id as student_id, u.name as student_name, u.roll_number, u.email,
                   m.id as mark_id, m.marks_obtained, m.is_absent, m.comments, m.updated_at, m.updated_by
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            LEFT JOIN marks_entries m ON m.component_id = ? AND m.student_id = u.id
            WHERE e.course_id = ?
            ORDER BY u.roll_number ASC, u.name ASC
        """, (component_id, comp["course_id"]))
        
        students_marks = [dict(row) for row in cursor.fetchall()]

        return {
            "component": dict(comp),
            "students": students_marks
        }

@app.post("/api/components/{component_id}/marks")
def save_single_student_mark(component_id: str, payload: SingleMarkUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        # Verify component & course lock
        cursor.execute("""
            SELECT cc.*, c.is_locked as course_is_locked
            FROM course_components cc
            JOIN courses c ON cc.course_id = c.id
            WHERE cc.id = ?
        """, (component_id,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Component not found")
        if comp["course_is_locked"] or comp["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot edit marks: Course or component is locked.")

        # Validate mark range
        if not payload.is_absent and payload.marks_obtained is not None:
            if payload.marks_obtained < 0 or payload.marks_obtained > comp["max_marks"]:
                raise HTTPException(status_code=400, detail=f"Marks must be between 0 and maximum marks ({comp['max_marks']})")

        # Fetch student info
        cursor.execute("SELECT * FROM users WHERE id = ?", (payload.student_id,))
        stu = cursor.fetchone()
        if not stu:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check existing mark
        cursor.execute("SELECT * FROM marks_entries WHERE component_id = ? AND student_id = ?",
                       (component_id, payload.student_id))
        existing = cursor.fetchone()

        old_val = existing["marks_obtained"] if existing else None
        old_absent = bool(existing["is_absent"]) if existing else False
        old_status = "absent" if old_absent else ("present" if old_val is not None else "not_entered")

        new_val = 0.0 if payload.is_absent else payload.marks_obtained
        new_status = "absent" if payload.is_absent else ("present" if new_val is not None else "not_entered")

        # Upsert mark
        mark_id = existing["id"] if existing else f"mrk-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO marks_entries (id, course_id, component_id, student_id, marks_obtained, is_absent, comments, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(component_id, student_id) DO UPDATE SET
                marks_obtained = excluded.marks_obtained,
                is_absent = excluded.is_absent,
                comments = excluded.comments,
                updated_by = excluded.updated_by,
                updated_at = CURRENT_TIMESTAMP
        """, (mark_id, comp["course_id"], component_id, payload.student_id, new_val, int(payload.is_absent), payload.comments, payload.changed_by_name))

        # Always record audit log if value or absence changed
        if old_val != new_val or old_absent != payload.is_absent:
            cursor.execute("""
                INSERT INTO mark_audit_logs (
                    id, course_id, component_id, component_name, student_id, student_roll, student_name,
                    old_value, new_value, old_status, new_status,
                    changed_by_id, changed_by_name, changed_by_role, reason, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
            """, (
                f"aud-{uuid.uuid4().hex[:8]}", comp["course_id"], component_id, comp["name"],
                stu["id"], stu["roll_number"] or "", stu["name"],
                old_val, new_val, old_status, new_status,
                payload.changed_by_id, payload.changed_by_name, payload.changed_by_role,
                payload.reason or "Score update"
            ))

    return {"message": "Marks updated and logged in audit trail"}

@app.post("/api/components/{component_id}/bulk-save")
def bulk_save_marks(component_id: str, payload: BulkMarksSave):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cc.*, c.is_locked as course_is_locked
            FROM course_components cc
            JOIN courses c ON cc.course_id = c.id
            WHERE cc.id = ?
        """, (component_id,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Component not found")
        if comp["course_is_locked"] or comp["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot edit marks: Course is locked.")

        # Process each student
        changed_count = 0
        for entry in payload.entries:
            if not entry.is_absent and entry.marks_obtained is not None:
                if entry.marks_obtained < 0 or entry.marks_obtained > comp["max_marks"]:
                    continue

            cursor.execute("SELECT * FROM marks_entries WHERE component_id = ? AND student_id = ?",
                           (component_id, entry.student_id))
            existing = cursor.fetchone()

            old_val = existing["marks_obtained"] if existing else None
            old_absent = bool(existing["is_absent"]) if existing else False
            new_val = 0.0 if entry.is_absent else entry.marks_obtained

            if existing is None or old_val != new_val or old_absent != entry.is_absent:
                mark_id = existing["id"] if existing else f"mrk-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO marks_entries (id, course_id, component_id, student_id, marks_obtained, is_absent, comments, updated_by, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(component_id, student_id) DO UPDATE SET
                        marks_obtained = excluded.marks_obtained,
                        is_absent = excluded.is_absent,
                        comments = excluded.comments,
                        updated_by = excluded.updated_by,
                        updated_at = CURRENT_TIMESTAMP
                """, (mark_id, comp["course_id"], component_id, entry.student_id, new_val, int(entry.is_absent), entry.comments, payload.changed_by_name))

                # Log audit
                cursor.execute("SELECT * FROM users WHERE id = ?", (entry.student_id,))
                stu = cursor.fetchone()
                cursor.execute("""
                    INSERT INTO mark_audit_logs (
                        id, course_id, component_id, component_name, student_id, student_roll, student_name,
                        old_value, new_value, old_status, new_status,
                        changed_by_id, changed_by_name, changed_by_role, reason, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
                """, (
                    f"aud-{uuid.uuid4().hex[:8]}", comp["course_id"], component_id, comp["name"],
                    stu["id"], stu["roll_number"] or "", stu["name"],
                    old_val, new_val, "absent" if old_absent else ("present" if old_val is not None else "not_entered"),
                    "absent" if entry.is_absent else ("present" if new_val is not None else "not_entered"),
                    payload.changed_by_id, payload.changed_by_name, payload.changed_by_role,
                    payload.reason or "Bulk grid edit"
                ))
                changed_count += 1

    return {"message": f"Successfully updated {changed_count} student marks with audit trail"}

@app.get("/api/components/{component_id}/template")
def download_component_template(component_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cc.*, c.code, c.title, c.semester
            FROM course_components cc
            JOIN courses c ON cc.course_id = c.id
            WHERE cc.id = ?
        """, (component_id,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Component not found")

        cursor.execute("""
            SELECT u.id, u.name, u.roll_number, u.email
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            WHERE e.course_id = ?
            ORDER BY u.roll_number ASC, u.name ASC
        """, (comp["course_id"],))
        students = [dict(r) for r in cursor.fetchall()]

    excel_bytes = create_component_template_excel(
        course_info={"code": comp["code"], "title": comp["title"], "semester": comp["semester"]},
        component={"name": comp["name"], "code": comp["code"], "max_marks": comp["max_marks"]},
        students=students
    )

    filename = f"template_{comp['code']}_{comp['code']}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/components/{component_id}/upload")
async def upload_component_marks(
    component_id: str,
    file: UploadFile = File(...),
    changed_by_id: str = Form(...),
    changed_by_name: str = Form(...),
    changed_by_role: str = Form(...),
    reason: str = Form(...)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cc.*, c.is_locked as course_is_locked
            FROM course_components cc
            JOIN courses c ON cc.course_id = c.id
            WHERE cc.id = ?
        """, (component_id,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Component not found")
        if comp["course_is_locked"] or comp["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot upload marks: Course is locked.")

        # Read file
        file_bytes = await file.read()
        parsed_entries, errors = parse_component_upload(file_bytes, file.filename.lower(), float(comp["max_marks"]))

        if not parsed_entries and errors:
            raise HTTPException(status_code=400, detail={"errors": errors, "message": "File parsing failed"})

        # Map students by roll number
        cursor.execute("""
            SELECT u.id, u.name, u.roll_number, u.email
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            WHERE e.course_id = ?
        """, (comp["course_id"],))
        enrolled_map = {r["roll_number"].strip().lower(): dict(r) for r in cursor.fetchall() if r["roll_number"]}

        updated_count = 0
        unmatched_rolls = []

        for entry in parsed_entries:
            roll_key = entry["roll_number"].strip().lower()
            stu = enrolled_map.get(roll_key)
            if not stu:
                unmatched_rolls.append(entry["roll_number"])
                continue

            student_id = stu["id"]
            cursor.execute("SELECT * FROM marks_entries WHERE component_id = ? AND student_id = ?",
                           (component_id, student_id))
            existing = cursor.fetchone()

            old_val = existing["marks_obtained"] if existing else None
            old_absent = bool(existing["is_absent"]) if existing else False
            new_val = entry["marks_obtained"]
            new_absent = entry["is_absent"]

            mark_id = existing["id"] if existing else f"mrk-{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO marks_entries (id, course_id, component_id, student_id, marks_obtained, is_absent, comments, updated_by, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(component_id, student_id) DO UPDATE SET
                    marks_obtained = excluded.marks_obtained,
                    is_absent = excluded.is_absent,
                    comments = excluded.comments,
                    updated_by = excluded.updated_by,
                    updated_at = CURRENT_TIMESTAMP
            """, (mark_id, comp["course_id"], component_id, student_id, new_val, int(new_absent), entry["comments"], changed_by_name))

            # Audit record
            cursor.execute("""
                INSERT INTO mark_audit_logs (
                    id, course_id, component_id, component_name, student_id, student_roll, student_name,
                    old_value, new_value, old_status, new_status,
                    changed_by_id, changed_by_name, changed_by_role, reason, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'bulk_upload')
            """, (
                f"aud-{uuid.uuid4().hex[:8]}", comp["course_id"], component_id, comp["name"],
                stu["id"], stu["roll_number"], stu["name"],
                old_val, new_val,
                "absent" if old_absent else ("present" if old_val is not None else "not_entered"),
                "absent" if new_absent else ("present" if new_val is not None else "not_entered"),
                changed_by_id, changed_by_name, changed_by_role,
                f"Bulk upload from {file.filename}: {reason}"
            ))
            updated_count += 1

    return {
        "message": f"Successfully processed {updated_count} student marks from {file.filename}.",
        "updated_count": updated_count,
        "warnings": errors,
        "unmatched_roll_numbers": unmatched_rolls
    }


# ==========================================
# 6. CONSOLIDATED SHEET & MASTER EXPORT
# ==========================================
@app.get("/api/courses/{course_id}/consolidated")
def get_course_consolidated(course_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.name as instructor_name, u.email as instructor_email
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ?
        """, (course_id,))
        course = cursor.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        cursor.execute("SELECT * FROM component_groups WHERE course_id = ? ORDER BY display_order ASC", (course_id,))
        groups = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM course_components WHERE course_id = ? ORDER BY due_date ASC, code ASC", (course_id,))
        components = [dict(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT u.*
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            WHERE e.course_id = ?
            ORDER BY u.roll_number ASC, u.name ASC
        """, (course_id,))
        students = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM marks_entries WHERE course_id = ?", (course_id,))
        marks = [dict(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT * FROM grade_cutoffs 
            WHERE course_id = ? OR (course_id IS NULL AND NOT EXISTS (SELECT 1 FROM grade_cutoffs WHERE course_id = ?))
            ORDER BY min_percentage DESC
        """, (course_id, course_id))
        cutoffs = [dict(r) for r in cursor.fetchall()]

        res = calculate_consolidated_sheet(
            course=dict(course),
            groups=groups,
            components=components,
            students=students,
            marks_entries=marks,
            grade_cutoffs=cutoffs
        )
        return res

@app.get("/api/courses/{course_id}/export/excel")
def export_course_excel(course_id: str):
    sheet_data = get_course_consolidated(course_id)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM mark_audit_logs WHERE course_id = ? ORDER BY timestamp DESC", (course_id,))
        audit_logs = [dict(r) for r in cursor.fetchall()]

    excel_bytes = generate_consolidated_master_excel(sheet_data, audit_logs)
    filename = f"Internal_Marks_{sheet_data['course_code']}_{sheet_data['semester'].replace(' ', '_')}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==========================================
# 7. STUDENT PERSONAL VIEW & BREAKDOWN
# ==========================================
@app.get("/api/student/{student_id}/courses")
def get_student_courses(student_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.name as instructor_name, u.email as instructor_email
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            WHERE e.student_id = ?
            ORDER BY c.code ASC
        """, (student_id,))
        return [dict(r) for r in cursor.fetchall()]

@app.get("/api/student/{student_id}/course/{course_id}/breakdown")
def get_student_course_breakdown(student_id: str, course_id: str):
    full_sheet = get_course_consolidated(course_id)
    
    # Locate student in consolidated
    student_rec = next((s for s in full_sheet["students"] if s["student_id"] == student_id), None)
    if not student_rec:
        raise HTTPException(status_code=404, detail="Student not enrolled in this course")

    # Fetch revaluation requests for this student in this course
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, cc.name as component_name, cc.code as component_code, cc.max_marks
            FROM revaluation_requests r
            JOIN course_components cc ON r.component_id = cc.id
            WHERE r.course_id = ? AND r.student_id = ?
            ORDER BY r.created_at DESC
        """, (course_id, student_id))
        revals = [dict(r) for r in cursor.fetchall()]

    return {
        "course_id": full_sheet["course_id"],
        "course_code": full_sheet["course_code"],
        "course_title": full_sheet["course_title"],
        "semester": full_sheet["semester"],
        "department": full_sheet["department"],
        "submission_status": full_sheet["submission_status"],
        "is_locked": full_sheet["is_locked"],
        "locked_at": full_sheet["locked_at"],
        "student_performance": student_rec,
        "class_analytics_summary": {
            "total_students": full_sheet["analytics"]["total_students"],
            "class_mean": full_sheet["analytics"]["mean_score"],
            "class_highest": full_sheet["analytics"]["highest_score"],
            "pass_rate": full_sheet["analytics"]["pass_percentage"]
        },
        "revaluation_requests": revals
    }


# ==========================================
# 8. AUDIT LOGS & CHANGE TRAIL
# ==========================================
@app.get("/api/courses/{course_id}/audit-logs")
def get_course_audit_logs(course_id: str, limit: int = 100):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM mark_audit_logs
            WHERE course_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (course_id, limit))
        return [dict(r) for r in cursor.fetchall()]


# ==========================================
# 9. REVALUATION & GRIEVANCE REQUESTS
# ==========================================
@app.get("/api/courses/{course_id}/revaluations")
def get_course_revaluations(course_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, u.name as student_name, u.roll_number, cc.name as component_name, cc.code as component_code, cc.max_marks
            FROM revaluation_requests r
            JOIN users u ON r.student_id = u.id
            JOIN course_components cc ON r.component_id = cc.id
            WHERE r.course_id = ?
            ORDER BY r.created_at DESC
        """, (course_id,))
        return [dict(r) for r in cursor.fetchall()]

@app.post("/api/revaluations")
def create_revaluation(payload: RevaluationCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        # Verify enrollment
        cursor.execute("SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?",
                       (payload.course_id, payload.student_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="Student is not enrolled in this course")

        # Check existing pending request
        cursor.execute("""
            SELECT id FROM revaluation_requests
            WHERE component_id = ? AND student_id = ? AND status = 'pending'
        """, (payload.component_id, payload.student_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You already have an active pending revaluation request for this component.")

        req_id = f"rev-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO revaluation_requests (id, course_id, component_id, student_id, current_marks, expected_marks, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (req_id, payload.course_id, payload.component_id, payload.student_id, payload.current_marks, payload.expected_marks, payload.reason))

    return {"id": req_id, "message": "Revaluation request submitted successfully"}

@app.post("/api/revaluations/{reval_id}/resolve")
def resolve_revaluation(reval_id: str, payload: RevaluationResolve):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM revaluation_requests WHERE id = ?", (reval_id,))
        rev = cursor.fetchone()
        if not rev:
            raise HTTPException(status_code=404, detail="Revaluation request not found")
        
        # Check course lock state
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (rev["course_id"],))
        c = cursor.fetchone()
        if c and c["is_locked"] and payload.resolved_by_role.lower() not in ("hod", "coordinator"):
            raise HTTPException(status_code=403, detail="Course marks are frozen. Only HOD can approve adjustments.")

        # Update revaluation
        cursor.execute("""
            UPDATE revaluation_requests
            SET status = ?,
                faculty_response = ?,
                adjusted_marks = ?,
                resolved_at = CURRENT_TIMESTAMP,
                resolved_by = ?
            WHERE id = ?
        """, (payload.status, payload.faculty_response, payload.adjusted_marks, payload.resolved_by_name, reval_id))

        # If approved with new marks, update marks entry and record audit
        if payload.status == "approved" and payload.adjusted_marks is not None:
            # Update marks_entries
            cursor.execute("""
                INSERT INTO marks_entries (id, course_id, component_id, student_id, marks_obtained, is_absent, comments, updated_by, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(component_id, student_id) DO UPDATE SET
                    marks_obtained = excluded.marks_obtained,
                    is_absent = 0,
                    comments = excluded.comments,
                    updated_by = excluded.updated_by,
                    updated_at = CURRENT_TIMESTAMP
            """, (f"mrk-{uuid.uuid4().hex[:8]}", rev["course_id"], rev["component_id"], rev["student_id"], payload.adjusted_marks, f"Reval: {payload.faculty_response}", payload.resolved_by_name))

            # Fetch names for audit
            cursor.execute("SELECT * FROM users WHERE id = ?", (rev["student_id"],))
            stu = cursor.fetchone()
            cursor.execute("SELECT name FROM course_components WHERE id = ?", (rev["component_id"],))
            comp = cursor.fetchone()

            cursor.execute("""
                INSERT INTO mark_audit_logs (
                    id, course_id, component_id, component_name, student_id, student_roll, student_name,
                    old_value, new_value, old_status, new_status,
                    changed_by_id, changed_by_name, changed_by_role, reason, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'present', 'present', ?, ?, ?, ?, 'revaluation')
            """, (
                f"aud-{uuid.uuid4().hex[:8]}", rev["course_id"], rev["component_id"], comp["name"] if comp else "Component",
                stu["id"], stu["roll_number"] or "", stu["name"],
                rev["current_marks"], payload.adjusted_marks,
                payload.resolved_by_id, payload.resolved_by_name, payload.resolved_by_role,
                f"Revaluation Approved: {payload.faculty_response}"
            ))

    return {"message": f"Revaluation request {payload.status}"}


# ==========================================
# 10. GRADE CUTOFFS CONFIGURATION
# ==========================================
@app.get("/api/courses/{course_id}/grade-cutoffs")
def get_course_grade_cutoffs(course_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM grade_cutoffs 
            WHERE course_id = ? OR (course_id IS NULL AND NOT EXISTS (SELECT 1 FROM grade_cutoffs WHERE course_id = ?))
            ORDER BY display_order ASC
        """, (course_id, course_id))
        return [dict(r) for r in cursor.fetchall()]

@app.put("/api/courses/{course_id}/grade-cutoffs")
def update_course_grade_cutoffs(course_id: str, payload: GradeCutoffsUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_locked FROM courses WHERE id = ?", (course_id,))
        c = cursor.fetchone()
        if c and c["is_locked"]:
            raise HTTPException(status_code=400, detail="Cannot alter grade mapping for locked course")

        # Delete existing custom cutoffs for course
        cursor.execute("DELETE FROM grade_cutoffs WHERE course_id = ?", (course_id,))
        for idx, item in enumerate(payload.cutoffs, 1):
            cursor.execute("""
                INSERT INTO grade_cutoffs (id, course_id, grade, grade_point, min_percentage, description, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (f"gc-{uuid.uuid4().hex[:8]}", course_id, item.grade, item.grade_point, item.min_percentage, item.description, idx))

    return {"message": "Grade cutoffs updated"}
