import pypdf
import re
import json

def extract_and_generate_students(pdf_path, output_json_path):
    reader = pypdf.PdfReader(pdf_path)
    records = []
    
    for page in reader.pages:
        text = page.extract_text()
        for line in text.split('\n'):
            line = line.strip()
            # Match SN, Section, PRN, Name, Mark
            m = re.match(r'^(\d+)\s+([A-E])\s+(26070521\d{3})\s+(.+?)\s+(\d+)$', line)
            if m:
                sn = int(m.group(1))
                sec = m.group(2)
                prn = m.group(3)
                raw_name = m.group(4).strip()
                marks = int(m.group(5))
                records.append((sn, sec, prn, raw_name, marks))

    print(f"Total extracted records: {len(records)}")

    seen_emails = set()
    students = []
    
    for idx, (sn, sec, prn, raw_name, mark) in enumerate(records, 1):
        clean_name = " ".join(raw_name.split())
        name_title = " ".join(w.capitalize() for w in clean_name.split())
        
        parts = clean_name.lower().split()
        if len(parts) >= 2:
            base_slug = f"{parts[0]}.{parts[-1]}"
        else:
            base_slug = parts[0]
        base_slug = re.sub(r'[^a-z0-9.]', '', base_slug)
        email = f"{base_slug}@sitnagpur.siu.edu.in"
        c = 1
        while email in seen_emails:
            c += 1
            email = f"{base_slug}{c}@sitnagpur.siu.edu.in"
        seen_emails.add(email)

        student_entry = {
            "id": f"usr-stu-{idx}",
            "name": name_title,
            "email": email,
            "role": "student",
            "roll_number": prn,
            "department": f"B.Tech Computer Science & Engineering (Batch 2026-30) · Section {sec}",
            "avatar_url": None,
            "section": sec,
            "sn": sn,
            "ca1_iks_marks": mark
        }
        students.append(student_entry)

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(students, f, indent=2)
    
    print(f"Saved {len(students)} students to {output_json_path} successfully!")
    return students

if __name__ == "__main__":
    pdf_path = "/workspace/Students_IKS_Batch2026-30.pdf"
    output_path = "/workspace/internal-marks-system/backend/students_data.json"
    extract_and_generate_students(pdf_path, output_path)
