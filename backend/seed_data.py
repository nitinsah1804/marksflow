import json
import os
import random
from database import get_db, init_db

def seed_all(force: bool = False):
    init_db()
    
    current_dir = os.path.dirname(__file__)
    faculty_file = os.path.join(current_dir, "faculty_data.json")
    students_file = os.path.join(current_dir, "students_data.json")

    with open(faculty_file, "r", encoding="utf-8") as f:
        faculty_profiles = json.load(f)

    with open(students_file, "r", encoding="utf-8") as f:
        student_profiles = json.load(f)

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) as cnt FROM users")
        if cursor.fetchone()["cnt"] > 0:
            if not force:
                print("Database already seeded.")
                return
            print("Force re-seeding database...")
            tables = ["marks_entries", "mark_audit_logs", "revaluation_requests", "enrollments", "course_components", "component_groups", "courses", "users", "grade_cutoffs"]
            for t in tables:
                cursor.execute(f"DELETE FROM {t}")
            conn.commit()

        print(f"Seeding database with {len(faculty_profiles)} SIT faculty and {len(student_profiles)} Batch 2026-30 students...")

        # 1. Users Table
        users_to_insert = []
        for fac in faculty_profiles:
            users_to_insert.append((
                fac["id"], fac["name"], fac["email"], fac["role"], None, fac["email"].split("@")[0], fac["department"], fac.get("avatar_url")
            ))

        for stu in student_profiles:
            users_to_insert.append((
                stu["id"], stu["name"], stu["email"], stu["role"], stu["roll_number"], stu.get("username", stu["roll_number"]), stu["department"], stu.get("avatar_url")
            ))

        cursor.executemany("""
            INSERT INTO users (id, name, email, role, roll_number, username, department, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, users_to_insert)

        # 2. Courses
        sarvat_ali = next((f["id"] for f in faculty_profiles if "Sarvat Ali" in f["name"]), "usr-fac-1")
        ansar_sheikh = next((f["id"] for f in faculty_profiles if "Ansar Isak" in f["name"]), "usr-fac-24")
        courses = [
            ("crs-cs101", "TEE7300", "Programming in C", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 1 (Batch 2026-30)", 4, sarvat_ali, 0, None, None, None, "draft"),
            ("crs-cs102", "TEE7305", "Tinker Lab for Computer Science", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 1 (Batch 2026-30)", 2, ansar_sheikh, 0, None, None, None, "draft"),
            ("crs-thm6144", "THM6144", "Indian Knowledge Systems", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 1 (Batch 2026-30)", 2, "usr-fac-1", 0, None, None, None, "draft"),
            ("crs-cs201", "TEE7451", "Design and Analysis of Algorithms", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 3 (Batch 2025-29)", 4, "usr-fac-4", 0, None, None, None, "draft"),
            ("crs-cs301", "T7908", "Computer Networks", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 5 (Batch 2024-28)", 3, "usr-fac-1", 0, None, None, None, "draft"),
            ("crs-cs402", "TEE7127", "Deep Learning and Its Applications", "Department of Computer Science & Engineering, SIT Nagpur", "Semester 7 (Batch 2023-27)", 4, "usr-dir-1", 1, "2026-10-02 14:30:00", "Prof. (Dr.) Nitin Rakesh (Director)", "End-of-term internal marks compiled & verified by SIT Nagpur Academic Exam Cell", "locked")
        ]

        cursor.executemany("""
            INSERT INTO courses (id, code, title, department, semester, credits, instructor_id, is_locked, locked_at, locked_by, lock_reason, submission_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, courses)

        # 3. Component Groups
        groups = [
            # TEE7300: Programming in C (Semester 1, Batch 2026-30)
            ("grp-cs101-tests", "crs-cs101", "Continuous Assessment Tests (Theory)", 40.0, "best_n", 2, "Best 2 out of 3 written tests; top 2 scored components counted towards 40% weightage.", 1),
            ("grp-cs101-assign", "crs-cs101", "Coding Problem Sets & Mini-Project", 20.0, "average", 2, "Practical C programming assignments & systems CLI mini-project.", 2),
            ("grp-cs101-lab", "crs-cs101", "C Programming Lab Practical & Viva", 40.0, "direct_sum", 2, "Continuous lab evaluations (60 marks) + End-term viva voce (40 marks) scaled to 40%.", 3),

            # TEE7305: Tinker Lab for Computer Science (Semester 1, Batch 2026-30)
            ("grp-cs102-web", "crs-cs102", "Web Technologies & Data Analytics", 40.0, "direct_sum", 2, "Responsive HTML/CSS web design and Excel data analytics.", 1),
            ("grp-cs102-ard", "crs-cs102", "Embedded Systems & IoT Prototyping", 40.0, "direct_sum", 2, "Hands-on Arduino circuit design, sensors integration, and debugging.", 2),
            ("grp-cs102-viva", "crs-cs102", "Tinker Capstone & Technical Viva", 20.0, "direct_sum", 1, "Working hardware-software prototype demonstration & oral viva.", 3),

            # THM6144: Indian Knowledge Systems (Semester 1, Batch 2026-30)
            ("grp-thm6144-ca", "crs-thm6144", "Continuous Assessment (CA Tests)", 100.0, "average", 1, "Continuous Assessment evaluations as per SIT / SIU NEP academic framework.", 1),

            # T7908: Computer Networks (Semester 5)
            ("grp-cs301-tests", "crs-cs301", "Continuous Internal Evaluation (CIE Tests)", 40.0, "best_n", 2, "Written theory tests; highest 2 scores are automatically calculated and counted towards 40% weightage.", 1),
            ("grp-cs301-assign", "crs-cs301", "Assignments & Packet Tracer Project", 20.0, "average", 2, "Practical network packet analysis and socket programming assignments.", 2),
            ("grp-cs301-lab", "crs-cs301", "Networking Laboratory Practical", 40.0, "direct_sum", 2, "Laboratory performance (60 marks) + End-term Lab Exam/Viva (40 marks) scaled to 40%.", 3),

            # TEE7127: Deep Learning & Applications (Semester 7)
            ("grp-cs402-tests", "crs-cs402", "Periodic Internal Tests", 50.0, "best_n", 2, "Best 2 out of 3 periodic tests.", 1),
            ("grp-cs402-assign", "crs-cs402", "Coding Projects & Benchmarks", 30.0, "average", 2, "Model implementation notebooks and accuracy benchmarks.", 2),
            ("grp-cs402-seminar", "crs-cs402", "Research Paper Presentation", 20.0, "direct_sum", 1, "Critical review and defense of landmark AI paper.", 3),

            # TEE7451: Design and Analysis of Algorithms (Semester 3)
            ("grp-cs201-tests", "crs-cs201", "Internal Assessment Tests", 40.0, "best_n", 2, "Best 2 out of 3 algorithmic problem solving written tests.", 1),
            ("grp-cs201-assign", "crs-cs201", "Complex Problem Sets & Analysis", 20.0, "average", 2, "Asymptotic analysis and DP programming problem sets.", 2),
            ("grp-cs201-lab", "crs-cs201", "Algorithm Lab Implementation & Viva", 40.0, "direct_sum", 2, "Continuous lab evaluations and end-term coding viva.", 3),
        ]

        cursor.executemany("""
            INSERT INTO component_groups (id, course_id, name, weightage_percent, rule_type, best_n_count, description, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, groups)

        # 4. Course Components
        components = [
            # TEE7300: Programming in C Components
            ("cmp-cs101-t1", "crs-cs101", "grp-cs101-tests", "Test 1: C Basics, Control Flow & Loops", "T1", 50.0, 1.0, 0, "2026-08-28"),
            ("cmp-cs101-t2", "crs-cs101", "grp-cs101-tests", "Test 2: Arrays, Strings & Functions", "T2", 50.0, 1.0, 0, "2026-09-20"),
            ("cmp-cs101-t3", "crs-cs101", "grp-cs101-tests", "Test 3: Pointers, Structs & File I/O", "T3", 50.0, 1.0, 0, "2026-10-02"),
            ("cmp-cs101-a1", "crs-cs101", "grp-cs101-assign", "Problem Set: Recursion & Storage Classes", "A1", 25.0, 1.0, 0, "2026-09-08"),
            ("cmp-cs101-proj", "crs-cs101", "grp-cs101-assign", "Mini-Project: C CLI Systems Tool", "PROJ", 50.0, 1.0, 0, "2026-09-29"),
            ("cmp-cs101-labexp", "crs-cs101", "grp-cs101-lab", "C Programming Lab Experiments", "LAB-EXP", 60.0, 1.0, 0, "2026-10-03"),
            ("cmp-cs101-labviva", "crs-cs101", "grp-cs101-lab", "Practical Coding Exam & Viva", "LAB-VIVA", 40.0, 1.0, 0, "2026-10-05"),

            # TEE7305: Tinker Lab Components
            ("cmp-cs102-w1", "crs-cs102", "grp-cs102-web", "Responsive Web Design with HTML & CSS", "WEB-1", 50.0, 1.0, 0, "2026-09-12"),
            ("cmp-cs102-ex", "crs-cs102", "grp-cs102-web", "Data Analysis & Workbook Modeling in Excel", "EXCEL", 50.0, 1.0, 0, "2026-09-25"),
            ("cmp-cs102-a1", "crs-cs102", "grp-cs102-ard", "Arduino Microcontroller & Sensor Interfacing", "ARD-1", 50.0, 1.0, 0, "2026-09-18"),
            ("cmp-cs102-a2", "crs-cs102", "grp-cs102-ard", "Circuit Simulation & Hardware Debugging", "ARD-2", 50.0, 1.0, 0, "2026-10-01"),
            ("cmp-cs102-viva", "crs-cs102", "grp-cs102-viva", "Capstone Working Prototype & Technical Viva", "CAP-VIVA", 100.0, 1.0, 0, "2026-10-06"),

            # THM6144: Indian Knowledge Systems Components
            ("cmp-thm6144-ca1", "crs-thm6144", "grp-thm6144-ca", "CA-1: Indian Knowledge Systems Foundations & Heritage", "CA-1", 15.0, 1.0, 0, "2026-10-12"),

            # T7908: Computer Networks Components
            ("cmp-cs301-cie1", "crs-cs301", "grp-cs301-tests", "CIE Test 1: Physical & Data Link Layer", "CIE-1", 50.0, 1.0, 0, "2026-08-25"),
            ("cmp-cs301-cie2", "crs-cs301", "grp-cs301-tests", "CIE Test 2: Network Layer & Routing Protocols", "CIE-2", 50.0, 1.0, 0, "2026-09-18"),
            ("cmp-cs301-cie3", "crs-cs301", "grp-cs301-tests", "CIE Test 3: Transport & Application Layer", "CIE-3", 50.0, 1.0, 0, "2026-10-01"),
            ("cmp-cs301-a1", "crs-cs301", "grp-cs301-assign", "Assignment 1: Packet Analysis with Wireshark", "A1", 25.0, 1.0, 0, "2026-09-05"),
            ("cmp-cs301-proj", "crs-cs301", "grp-cs301-assign", "Mini-Project: Socket Programming Client-Server", "PROJ", 50.0, 1.0, 0, "2026-09-28"),
            ("cmp-cs301-labexp", "crs-cs301", "grp-cs301-lab", "Network Lab Practical Experiments", "LAB-EXP", 60.0, 1.0, 0, "2026-10-02"),
            ("cmp-cs301-labexam", "crs-cs301", "grp-cs301-lab", "Network Lab Exam & Viva Voce", "LAB-VIVA", 40.0, 1.0, 0, "2026-10-04"),

            # TEE7127: Deep Learning Components
            ("cmp-cs402-t1", "crs-cs402", "grp-cs402-tests", "Test 1: Backpropagation & Optimization", "T1", 50.0, 1.0, 1, "2026-08-30"),
            ("cmp-cs402-t2", "crs-cs402", "grp-cs402-tests", "Test 2: CNNs & Computer Vision", "T2", 50.0, 1.0, 1, "2026-09-22"),
            ("cmp-cs402-t3", "crs-cs402", "grp-cs402-tests", "Test 3: Transformers & Large Language Models", "T3", 50.0, 1.0, 1, "2026-10-03"),
            ("cmp-cs402-p1", "crs-cs402", "grp-cs402-assign", "Project: Vision Transformer from Scratch", "P1", 100.0, 1.0, 1, "2026-09-25"),
            ("cmp-cs402-sem", "crs-cs402", "grp-cs402-seminar", "Deep Learning Research Defense", "SEM", 50.0, 1.0, 1, "2026-10-01"),

            # TEE7451: Design & Analysis of Algorithms Components
            ("cmp-cs201-t1", "crs-cs201", "grp-cs201-tests", "Test 1: Asymptotic Analysis & Recurrences", "T1", 50.0, 1.0, 0, "2026-08-28"),
            ("cmp-cs201-t2", "crs-cs201", "grp-cs201-tests", "Test 2: Greedy & Dynamic Programming", "T2", 50.0, 1.0, 0, "2026-09-20"),
            ("cmp-cs201-t3", "crs-cs201", "grp-cs201-tests", "Test 3: Graphs & Complexity Classes", "T3", 50.0, 1.0, 0, "2026-10-02"),
            ("cmp-cs201-a1", "crs-cs201", "grp-cs201-assign", "Problem Set 1: Divide and Conquer", "A1", 25.0, 1.0, 0, "2026-09-10"),
            ("cmp-cs201-a2", "crs-cs201", "grp-cs201-assign", "Problem Set 2: Graph Network Flows", "A2", 25.0, 1.0, 0, "2026-09-29"),
            ("cmp-cs201-lab", "crs-cs201", "grp-cs201-lab", "Algorithms Laboratory Implementation", "LAB", 60.0, 1.0, 0, "2026-10-02"),
            ("cmp-cs201-viva", "crs-cs201", "grp-cs201-lab", "Practical Coding Exam & Viva", "VIVA", 40.0, 1.0, 0, "2026-10-04"),
        ]

        cursor.executemany("""
            INSERT INTO course_components (id, course_id, group_id, name, code, max_marks, weightage_in_group, is_locked, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, components)

        # 5. Enrollments
        # Enroll ALL 346 students in TEE7300, TEE7305, and THM6144
        enrollments = []
        for s in student_profiles:
            enrollments.append((f"enr-cs101-{s['id']}", "crs-cs101", s["id"]))
            enrollments.append((f"enr-cs102-{s['id']}", "crs-cs102", s["id"]))
            enrollments.append((f"enr-thm6144-{s['id']}", "crs-thm6144", s["id"]))

        for s in student_profiles[:45]:
            enrollments.append((f"enr-cs301-{s['id']}", "crs-cs301", s["id"]))
            enrollments.append((f"enr-cs201-{s['id']}", "crs-cs201", s["id"]))

        for s in student_profiles[:25]:
            enrollments.append((f"enr-cs402-{s['id']}", "crs-cs402", s["id"]))

        cursor.executemany("""
            INSERT INTO enrollments (id, course_id, student_id)
            VALUES (?, ?, ?)
        """, enrollments)

        # 6. Marks Entries
        marks_entries = []
        random.seed(42)

        # CS101 Marks for all 344 students
        cs101_comps = [
            ("cmp-cs101-t1", 50.0),
            ("cmp-cs101-t2", 50.0),
            ("cmp-cs101-t3", 50.0),
            ("cmp-cs101-a1", 25.0),
            ("cmp-cs101-proj", 50.0),
            ("cmp-cs101-labexp", 60.0),
            ("cmp-cs101-labviva", 40.0)
        ]

        for s_idx, s in enumerate(student_profiles):
            stu_id = s["id"]
            base_skill = random.uniform(0.60, 0.95)
            if s_idx in (15, 42, 89, 150, 210, 305):
                base_skill = random.uniform(0.35, 0.48) # at risk
            if s_idx in (0, 1, 5, 20, 50, 100):
                base_skill = random.uniform(0.92, 0.98) # top tier

            for comp_id, max_m in cs101_comps:
                is_ab = 1 if (random.random() < 0.02 and s_idx > 5) else 0
                if is_ab:
                    score = 0.0
                    comment = "Medical absence authorized"
                else:
                    noise = random.uniform(-0.08, 0.08)
                    pct = max(0.2, min(1.0, base_skill + noise))
                    score = round(pct * max_m * 2) / 2.0
                    comment = "Evaluated"

                uid = f"mrk-{comp_id}-{s_idx+1}"
                marks_entries.append((
                    uid, "crs-cs101", comp_id, stu_id, score, is_ab, comment, "Prof. Sarvat Ali"
                ))

        # TEE7305 Tinker Lab Marks for all 344 students
        cs102_comps = [
            ("cmp-cs102-w1", 50.0),
            ("cmp-cs102-ex", 50.0),
            ("cmp-cs102-a1", 50.0),
            ("cmp-cs102-a2", 50.0),
            ("cmp-cs102-viva", 100.0)
        ]
        for s_idx, s in enumerate(student_profiles):
            stu_id = s["id"]
            base_skill = random.uniform(0.65, 0.96)
            for comp_id, max_m in cs102_comps:
                is_ab = 1 if (random.random() < 0.01 and s_idx > 10) else 0
                if is_ab:
                    score = 0.0
                    comment = "Lab absence recorded"
                else:
                    noise = random.uniform(-0.06, 0.06)
                    pct = max(0.35, min(1.0, base_skill + noise))
                    score = round(pct * max_m * 2) / 2.0
                    comment = "Practical Rubric Completed"
                marks_entries.append((
                    f"mrk-{comp_id}-{s_idx+1}", "crs-cs102", comp_id, stu_id, score, is_ab, comment, "Prof. Ansar Isak Sheikh"
                ))

        # THM6144: Indian Knowledge Systems Marks (Exact CA-1 from Official SIT PDF)
        for s_idx, s in enumerate(student_profiles):
            stu_id = s["id"]
            ca1_score = float(s.get("ca1_iks_marks", 15))
            is_ab = 1 if ca1_score == 0 else 0
            comm = "Absent / Unattempted" if is_ab else f"Verified CA-1: {ca1_score}/15"
            marks_entries.append((
                f"mrk-thm6144-ca1-{s_idx+1}", "crs-thm6144", "cmp-thm6144-ca1", stu_id, ca1_score, is_ab, comm, "Dr. Snehlata Wankhade"
            ))

        # CS301 Marks for 45 students (with exact test verification values)
        cs301_comps = [
            ("cmp-cs301-cie1", 50.0),
            ("cmp-cs301-cie2", 50.0),
            ("cmp-cs301-cie3", 50.0),
            ("cmp-cs301-a1", 25.0),
            ("cmp-cs301-proj", 50.0),
            ("cmp-cs301-labexp", 60.0),
            ("cmp-cs301-labexam", 40.0)
        ]

        for s_idx, s in enumerate(student_profiles[:45]):
            stu_id = s["id"]
            if s_idx == 0:
                s_scores = [48.0, 45.0, 49.0, 24.5, 49.0, 58.0, 39.0]
                s_abs = [0, 0, 0, 0, 0, 0, 0]
            elif s_idx == 1:
                s_scores = [42.0, 47.0, 44.0, 23.0, 46.0, 56.0, 37.0]
                s_abs = [0, 0, 0, 0, 0, 0, 0]
            elif s_idx == 2:
                # Student 3: Demonstrates Best-of-N rule: CIE1 dropped (26), CIE2 counted (41), CIE3 counted (43)
                s_scores = [26.0, 41.0, 43.0, 21.0, 42.0, 50.0, 33.0]
                s_abs = [0, 0, 0, 0, 0, 0, 0]
            elif s_idx == 3:
                # Student 4: Medical absence in CIE2
                s_scores = [38.0, 0.0, 42.0, 22.0, 44.0, 54.0, 35.0]
                s_abs = [0, 1, 0, 0, 0, 0, 0]
            elif s_idx == 4:
                # Borderline
                s_scores = [22.0, 25.0, 29.0, 16.0, 28.0, 38.0, 24.0]
                s_abs = [0, 0, 0, 0, 0, 0, 0]
            elif s_idx == 6:
                # At-risk
                s_scores = [18.0, 19.0, 21.0, 12.0, 25.0, 34.0, 18.0]
                s_abs = [0, 0, 0, 0, 0, 0, 0]
            else:
                pct = random.uniform(0.68, 0.92)
                s_scores = [round(pct * m * 2)/2.0 for _, m in cs301_comps]
                s_abs = [0] * len(cs301_comps)

            for c_i, (comp_id, max_m) in enumerate(cs301_comps):
                uid = f"mrk-{comp_id}-{s_idx+1}"
                marks_entries.append((
                    uid, "crs-cs301", comp_id, stu_id, s_scores[c_i], s_abs[c_i], "Evaluated", "Dr. Snehlata Wankhade"
                ))

        cursor.executemany("""
            INSERT INTO marks_entries (id, course_id, component_id, student_id, marks_obtained, is_absent, comments, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, marks_entries)

        # 7. Audit Trail records
        stu1 = student_profiles[0] # Disha Aher
        stu2 = student_profiles[1] # Pali Yamini
        stu3 = student_profiles[2] # Malugu Rohit
        stu4 = student_profiles[3] # Manish Sahu
        stu5 = student_profiles[4] # Saaloni Kamlesh

        audit_records = [
            ("aud-1", "crs-cs301", "cmp-cs301-cie1", "CIE Test 1: Relational Algebra & SQL", stu3["id"], stu3["roll_number"], stu3["name"], 23.0, 26.0, "present", "present", "usr-fac-1", "Dr. Snehlata Wankhade", "faculty", "Re-totaling discrepancy in Question 4(b) identified during paper viewing session", "2026-08-29 11:20:00", "revaluation"),
            ("aud-2", "crs-cs301", "cmp-cs301-cie2", "CIE Test 2: Normalization & Transactions", stu4["id"], stu4["roll_number"], stu4["name"], None, 0.0, "not_entered", "absent", "usr-fac-1", "Dr. Snehlata Wankhade", "faculty", "Marked absent per medical certificate approved by HOD Dr. Sagarkumar Badhiye", "2026-09-19 09:15:00", "manual"),
            ("aud-3", "crs-cs301", "cmp-cs301-proj", "Mini-Project: Full Schema Design", stu1["id"], stu1["roll_number"], stu1["name"], 47.0, 49.0, "present", "present", "usr-fac-1", "Dr. Snehlata Wankhade", "faculty", "Extra credit awarded for schema optimization and 1M tuple indexing benchmarks", "2026-09-30 16:45:00", "manual"),
            ("aud-4", "crs-cs101", "cmp-cs101-proj", "Mini-Project: Python CLI Application", stu1["id"], stu1["roll_number"], stu1["name"], 46.0, 49.0, "present", "present", sarvat_ali, "Prof. Sarvat Ali", "faculty", "Outstanding object-oriented CLI architecture and test coverage", "2026-10-01 14:10:00", "manual")
        ]

        cursor.executemany("""
            INSERT INTO mark_audit_logs (id, course_id, component_id, component_name, student_id, student_roll, student_name, old_value, new_value, old_status, new_status, changed_by_id, changed_by_name, changed_by_role, reason, timestamp, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, audit_records)

        # 8. Revaluation Requests
        reval_requests = [
            ("rev-1", "crs-cs301", "cmp-cs301-cie3", stu5["id"], 29.0, 33.0, "Respected Ma'am, in Question 5 on B+ tree index insertion, the split diagram was drawn correctly on supplementary sheet page 4 but was marked unattempted. Kindly re-evaluate.", "pending", None, None, "2026-10-03 10:14:00", None, None),
            ("rev-2", "crs-cs301", "cmp-cs301-cie1", stu3["id"], 23.0, 26.0, "Addition error in Section B subtotal.", "approved", "Verified paper. 3 marks added for Question 4(b) relational algebra projection.", 26.0, "2026-08-28 14:00:00", "2026-08-29 11:20:00", "Dr. Snehlata Wankhade"),
            ("rev-3", "crs-cs101", "cmp-cs101-t2", stu1["id"], 38.0, 42.0, "Respected Sir, dictionary comprehension question 3(c) was verified against official test suite. Kindly review.", "pending", None, None, "2026-10-04 09:30:00", None, None)
        ]

        cursor.executemany("""
            INSERT INTO revaluation_requests (id, course_id, component_id, student_id, current_marks, expected_marks, reason, status, faculty_response, adjusted_marks, created_at, resolved_at, resolved_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, reval_requests)

        # 9. Grade Cutoffs
        cutoffs = [
            ("gc-1", None, "O", 10, 90.0, "Outstanding Mastery", 1),
            ("gc-2", None, "A+", 9, 80.0, "Excellent Performance", 2),
            ("gc-3", None, "A", 8, 70.0, "Very Good", 3),
            ("gc-4", None, "B+", 7, 60.0, "Good", 4),
            ("gc-5", None, "B", 6, 55.0, "Above Average", 5),
            ("gc-6", None, "C", 5, 50.0, "Average", 6),
            ("gc-7", None, "P", 4, 40.0, "Pass (Minimum Threshold)", 7),
            ("gc-8", None, "F", 0, 0.0, "Fail (Course Incomplete)", 8),
        ]

        cursor.executemany("""
            INSERT INTO grade_cutoffs (id, course_id, grade, grade_point, min_percentage, description, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, cutoffs)

        print(f"Database seeded successfully with {len(faculty_profiles)} faculty members and {len(student_profiles)} Batch 2026-30 students!")

if __name__ == "__main__":
    seed_all()
