import pypdf
import re
import json

def parse_students_from_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    all_text = ""
    for page in reader.pages:
        all_text += "\n" + page.extract_text()
    
    # Clean header and footer artifacts
    all_text = re.sub(r'SYMBIOSIS INSTITUTE OF TECHNOLOGY.*', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'Symbiosis International.*', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'\(Established under section.*?\)', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'Re-accredited by NAAC.*', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'Founder:.*', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'I Semester Batch 2026-30 Subject: IKS', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'CA-1', '', all_text, flags=re.IGNORECASE)
    all_text = re.sub(r'SN\s+Section\s+PRN\s+Full Name\s+Total.*', '', all_text, flags=re.IGNORECASE)

    # Normalize whitespace
    normalized = re.sub(r'\s+', ' ', all_text).strip()

    # Pattern: SN (1-3 digits), Section (A-E), PRN (11 digits), Full Name, Total Marks (0-15)
    pattern = r'(\d{1,3})\s+([A-E])\s+(26070521\d{3})\s+([A-Z\s\.\'\-]+?)\s+(\d{1,2})(?=\s+\d{1,3}\s+[A-E]\s+26070521|\s*$)'
    matches = re.findall(pattern, normalized)
    
    students = []
    seen_prns = set()
    for sn, sec, prn, raw_name, marks in matches:
        clean_name = " ".join(raw_name.strip().split())
        # Convert to Title Case for display while keeping acronyms clean
        name_title = " ".join(w.capitalize() for w in clean_name.split())
        
        # Email formatting: firstname.lastname@sitnagpur.siu.edu.in
        parts = clean_name.lower().split()
        if len(parts) >= 2:
            base_slug = f"{parts[0]}.{parts[-1]}"
        else:
            base_slug = parts[0]
        base_slug = re.sub(r'[^a-z0-9.]', '', base_slug)
        email = f"{base_slug}@sitnagpur.siu.edu.in"
        
        students.append({
            "sn": int(sn),
            "section": sec,
            "prn": prn,
            "raw_name": clean_name,
            "name": name_title,
            "email_slug": base_slug,
            "ca1_marks": int(marks)
        })
        seen_prns.add(prn)

    return students

if __name__ == "__main__":
    pdf_path = "/workspace/Students_IKS_Batch2026-30.pdf"
    students = parse_students_from_pdf(pdf_path)
    print(f"Extracted {len(students)} students from PDF.")
    sections = {}
    for s in students:
        sections.setdefault(s["section"], []).append(s)
    for sec in sorted(sections.keys()):
        print(f"  Section {sec}: {len(sections[sec])} students (min SN: {min(s['sn'] for s in sections[sec])}, max SN: {max(s['sn'] for s in sections[sec])})")
