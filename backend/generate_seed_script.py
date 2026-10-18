from bs4 import BeautifulSoup
import re, glob, os, random, json

print("Parsing faculty from pages...")

# 1. FACULTY
faculty_members = []
seen_names = set()

# Special leadership first
faculty_members.append({
    'id': 'usr-dir-1',
    'name': 'Prof. (Dr.) Nitin Rakesh',
    'email': 'director@sitnagpur.siu.edu.in',
    'role': 'hod',
    'department': 'Symbiosis Institute of Technology (SIT), Nagpur',
    'designation': 'Director & Senior Professor',
    'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('nitin rakesh')

faculty_members.append({
    'id': 'usr-dep-1',
    'name': 'Dr. Sandeep Kumar',
    'email': 'deputy.director@sitnagpur.siu.edu.in',
    'role': 'faculty',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'Deputy Director & Professor',
    'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('sandeep kumar')

faculty_members.append({
    'id': 'usr-hod-1',
    'name': 'Dr. Sagarkumar Shridhar Badhiye',
    'email': 'hod.cse@sitnagpur.siu.edu.in',
    'role': 'hod',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'HOD (CSE) & Associate Professor',
    'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('sagarkumar shridhar badhiye')

faculty_members.append({
    'id': 'usr-fac-1',
    'name': 'Dr. Snehlata Wankhade',
    'email': 'snehlata.wankhade@sitnagpur.siu.edu.in',
    'role': 'faculty',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'Assistant Professor (Senior Scale)',
    'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('snehlata wankhade')

faculty_members.append({
    'id': 'usr-fac-2',
    'name': 'Dr. Shreyas Rajendra Hole',
    'email': 'shreyas.hole@sitnagpur.siu.edu.in',
    'role': 'faculty',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'Assistant Professor (Ph.D. AI/ML)',
    'avatar_url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('shreyas rajendra hole')

faculty_members.append({
    'id': 'usr-fac-3',
    'name': 'Dr. Bhupesh Kumar Dewangan',
    'email': 'bhupesh.dewangan@sitnagpur.siu.edu.in',
    'role': 'faculty',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'Associate Professor',
    'avatar_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('bhupesh kumar dewangan')

faculty_members.append({
    'id': 'usr-fac-4',
    'name': 'Dr. Parul Dubey',
    'email': 'parul.dubey@sitnagpur.siu.edu.in',
    'role': 'faculty',
    'department': 'Department of Computer Science & Engineering, SIT Nagpur',
    'designation': 'Assistant Professor (AWS Certified)',
    'avatar_url': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80'
})
seen_names.add('parul dubey')

faculty_files = sorted(glob.glob('/workspace/pages/faculty-profile*.md'))
f_idx = 5

for f in faculty_files:
    fname = os.path.basename(f)
    if fname in ('faculty-profile.md', 'faculty-profile_10_1007_978-981-19-2538-2.md', 'public_faculty-profile.md'):
        continue
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    
    h1 = ''
    m = re.search(r'^#\s*(.+)', content, re.M)
    if m:
        h1 = m.group(1).strip()
    name = h1.split('-')[0].strip().replace('**URL:**', '').strip()
    if not name or 'http' in name or name == '':
        base = fname.replace('faculty-profile_', '').replace('.md', '')
        name = ' '.join(w.capitalize() for w in base.split('-'))
    if not name.startswith('Dr.') and not name.startswith('Prof.') and not name.startswith('Dr '):
        name = 'Dr. ' + name
    
    clean_key = re.sub(r'^(Dr\.|Prof\.|Dr)\s*', '', name).strip().lower()
    if any(k in clean_key for k in seen_names):
        continue
    seen_names.add(clean_key)
    
    desig = 'Assistant Professor'
    if 'HOD' in content[:1500] or 'Head of Department' in content[:1500]:
        desig = 'HOD & Associate Professor'
    elif 'Associate Professor' in content[:1500]:
        desig = 'Associate Professor'
    elif 'Assistant Professor (Senior Scale)' in content[:1500]:
        desig = 'Assistant Professor (Senior Scale)'
    elif 'Professor' in content[:1500]:
        desig = 'Professor'
        
    dept = 'Department of Computer Science & Engineering, SIT Nagpur'
    if any(k in content[:2000] for k in ['Mathematics', 'Physics', 'Chemistry', 'Applied Science', 'Humanities']):
        dept = 'Department of Applied Sciences & Humanities, SIT Nagpur'
    elif 'Mechanical' in content[:2000]:
        dept = 'Department of Mechanical Engineering, SIT Nagpur'
    elif 'Civil' in content[:2000]:
        dept = 'Department of Civil Engineering, SIT Nagpur'
    elif 'Electronics' in content[:2000] or 'E&TC' in content[:2000]:
        dept = 'Department of Electronics & Telecommunication, SIT Nagpur'
    
    slug = re.sub(r'[^a-z0-9]', '.', clean_key)
    slug = re.sub(r'\.+', '.', slug).strip('.')
    email = f'{slug}@sitnagpur.siu.edu.in'
    
    faculty_members.append({
        'id': f'usr-fac-{f_idx}',
        'name': name,
        'email': email,
        'role': 'faculty',
        'department': dept,
        'designation': desig,
        'avatar_url': None
    })
    f_idx += 1

# LMS Teachers
lms_teachers = [
    ('Prof. Sarvat Ali', 'sarvat.ali@sitnagpur.siu.edu.in', 'Assistant Professor', 'Department of Computer Science & Engineering, SIT Nagpur'),
    ('Prof. Mrudula Nimbarte', 'mrudula.nimbarte@sitnagpur.siu.edu.in', 'Assistant Professor', 'Department of Computer Science & Engineering, SIT Nagpur'),
    ('Prof. Ansar Isak Sheikh', 'ansar.sheikh@sitnagpur.siu.edu.in', 'Assistant Professor', 'Department of Computer Science & Engineering, SIT Nagpur'),
    ('Prof. Ashwini Zadgaonkar', 'ashwini.zadgaonkar@sitnagpur.siu.edu.in', 'Assistant Professor', 'Department of Computer Science & Engineering, SIT Nagpur')
]

for t_name, t_email, t_desig, t_dept in lms_teachers:
    faculty_members.append({
        'id': f'usr-fac-{f_idx}',
        'name': t_name,
        'email': t_email,
        'role': 'faculty',
        'department': t_dept,
        'designation': t_desig,
        'avatar_url': None
    })
    f_idx += 1

print(f"Total faculty members: {len(faculty_members)}")

# 2. Parse Students from HTML
print("Parsing students from LMS HTML...")
with open('/workspace/Students list sitnagpur-lms.html', 'r', encoding='utf-8', errors='ignore') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

table = soup.find('table')
rows = table.find_all('tr')
student_members = []
seen_emails = set()

for idx, r in enumerate(rows[1:], 1):
    cells = [c.get_text(strip=True) for c in r.find_all(['th', 'td'])]
    if len(cells) < 4:
        continue
    name_raw = cells[1]
    role = cells[2]
    groups = cells[3] if len(cells) > 3 else ''
    last_access = cells[4] if len(cells) > 4 else ''
    
    if 'Student' in role:
        clean_name = ' '.join(w.capitalize() for w in name_raw.split())
        parts = clean_name.lower().split()
        if len(parts) >= 2:
            base_slug = f'{parts[0]}.{parts[-1]}'
        else:
            base_slug = parts[0]
        base_slug = re.sub(r'[^a-z0-9.]', '', base_slug)
        email = f'{base_slug}@sitnagpur.siu.edu.in'
        c = 1
        while email in seen_emails:
            c += 1
            email = f'{base_slug}{c}@sitnagpur.siu.edu.in'
        seen_emails.add(email)
        
        prn = f'SIT26BCSE{len(student_members)+1:03d}'
        student_members.append({
            'id': f'usr-stu-{len(student_members)+1}',
            'name': clean_name,
            'email': email,
            'role': 'student',
            'roll_number': prn,
            'department': f'B.Tech Computer Science & Engineering (Batch 2026-30) · {groups or "Section A"}',
            'avatar_url': None,
            'group': groups
        })

print(f"Total students parsed: {len(student_members)}")

# Write json files for safe loading
with open('/workspace/internal-marks-system/backend/faculty_data.json', 'w', encoding='utf-8') as f:
    json.dump(faculty_members, f, indent=2)

with open('/workspace/internal-marks-system/backend/students_data.json', 'w', encoding='utf-8') as f:
    json.dump(student_members, f, indent=2)

print("Saved faculty_data.json and students_data.json successfully!")
