import math
from typing import Dict, List, Any, Optional

def round_marks(val: Optional[float], decimals: int = 2) -> Optional[float]:
    if val is None:
        return None
    return round(float(val), decimals)

def calculate_student_breakdown(
    student: Dict[str, Any],
    groups: List[Dict[str, Any]],
    components_by_group: Dict[str, List[Dict[str, Any]]],
    marks_map: Dict[str, Dict[str, Any]], # (student_id, component_id) -> mark dict
    grade_cutoffs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    student_id = student["id"]
    groups_summary = []
    total_weighted_score = 0.0
    total_max_weight = 0.0

    for group in groups:
        group_id = group["id"]
        group_weight = float(group["weightage_percent"])
        total_max_weight += group_weight
        rule_type = group["rule_type"]
        best_n_count = int(group.get("best_n_count") or 1)
        comps = components_by_group.get(group_id, [])

        comp_details = []
        for comp in comps:
            comp_id = comp["id"]
            max_m = float(comp["max_marks"])
            mark_entry = marks_map.get((student_id, comp_id))

            marks_obtained = None
            is_absent = False
            percentage = 0.0
            status = "not_entered"

            if mark_entry:
                is_absent = bool(mark_entry.get("is_absent", 0))
                if is_absent:
                    marks_obtained = 0.0
                    percentage = 0.0
                    status = "absent"
                elif mark_entry.get("marks_obtained") is not None:
                    marks_obtained = float(mark_entry["marks_obtained"])
                    percentage = (marks_obtained / max_m * 100.0) if max_m > 0 else 0.0
                    status = "present"
            
            comp_details.append({
                "component_id": comp_id,
                "name": comp["name"],
                "code": comp["code"],
                "max_marks": max_m,
                "marks_obtained": marks_obtained,
                "is_absent": is_absent,
                "percentage": round_marks(percentage),
                "status": status,
                "is_included": True # default until Best-of-N evaluated
            })

        group_percentage = 0.0
        applied_rule_explanation = ""

        if not comp_details:
            group_percentage = 0.0
            applied_rule_explanation = "No components defined in this group."
        elif rule_type == "best_n":
            # Best N of M based on percentage score
            n = min(best_n_count, len(comp_details))
            # Sort by percentage descending
            sorted_indices = sorted(
                range(len(comp_details)),
                key=lambda i: (
                    comp_details[i]["status"] == "present",
                    comp_details[i]["percentage"] if comp_details[i]["percentage"] is not None else -1
                ),
                reverse=True
            )
            
            included_indices = set(sorted_indices[:n])
            for i, comp in enumerate(comp_details):
                comp["is_included"] = (i in included_indices)

            top_scores = [comp_details[i]["percentage"] or 0.0 for i in included_indices]
            group_percentage = (sum(top_scores) / n) if n > 0 else 0.0
            applied_rule_explanation = f"Best {n} of {len(comp_details)} components counted."
        elif rule_type == "direct_sum":
            # Sum of marks / Sum of max marks
            sum_obtained = sum((c["marks_obtained"] or 0.0) for c in comp_details if c["status"] == "present")
            sum_max = sum(c["max_marks"] for c in comp_details)
            group_percentage = (sum_obtained / sum_max * 100.0) if sum_max > 0 else 0.0
            applied_rule_explanation = f"Direct sum of raw marks: {sum_obtained:.1f}/{sum_max:.1f} ({group_percentage:.1f}%)."
        else: # 'average' or default
            # Simple average of percentages of all components
            percentages = [c["percentage"] or 0.0 for c in comp_details]
            group_percentage = (sum(percentages) / len(percentages)) if percentages else 0.0
            applied_rule_explanation = f"Equal average of all {len(comp_details)} components."

        weighted_contribution = (group_percentage / 100.0) * group_weight
        total_weighted_score += weighted_contribution

        groups_summary.append({
            "group_id": group_id,
            "group_name": group["name"],
            "rule_type": rule_type,
            "best_n_count": best_n_count,
            "group_weightage": group_weight,
            "group_percentage": round_marks(group_percentage),
            "weighted_contribution": round_marks(weighted_contribution),
            "explanation": applied_rule_explanation,
            "components": comp_details
        })

    # Normalized score out of 100 (in case total configured weight != 100)
    normalized_total = (total_weighted_score / total_max_weight * 100.0) if total_max_weight > 0 else 0.0
    final_score = round_marks(total_weighted_score)

    # Determine Grade and Grade Point
    grade = "F"
    grade_point = 0
    grade_desc = "Fail"
    for cutoff in sorted(grade_cutoffs, key=lambda x: x["min_percentage"], reverse=True):
        if final_score >= cutoff["min_percentage"]:
            grade = cutoff["grade"]
            grade_point = cutoff["grade_point"]
            grade_desc = cutoff["description"]
            break

    is_passed = (final_score >= 40.0)
    is_at_risk = (final_score < 50.0)

    return {
        "student_id": student["id"],
        "student_name": student["name"],
        "roll_number": student.get("roll_number") or "",
        "email": student["email"],
        "groups": groups_summary,
        "total_marks": final_score,
        "normalized_percentage": round_marks(normalized_total),
        "total_max_weight": total_max_weight,
        "grade": grade,
        "grade_point": grade_point,
        "grade_desc": grade_desc,
        "is_passed": is_passed,
        "is_at_risk": is_at_risk,
        "rank": None # populated after all students processed
    }

def calculate_consolidated_sheet(
    course: Dict[str, Any],
    groups: List[Dict[str, Any]],
    components: List[Dict[str, Any]],
    students: List[Dict[str, Any]],
    marks_entries: List[Dict[str, Any]],
    grade_cutoffs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    # Group components by group_id
    components_by_group = {}
    for comp in components:
        components_by_group.setdefault(comp["group_id"], []).append(comp)

    # Map marks by (student_id, component_id)
    marks_map = {}
    for me in marks_entries:
        marks_map[(me["student_id"], me["component_id"])] = me

    # Compute student breakdowns
    student_records = []
    for student in students:
        record = calculate_student_breakdown(
            student=student,
            groups=groups,
            components_by_group=components_by_group,
            marks_map=marks_map,
            grade_cutoffs=grade_cutoffs
        )
        student_records.append(record)

    # Rank students by total_marks descending
    sorted_records = sorted(student_records, key=lambda s: s["total_marks"] or 0.0, reverse=True)
    current_rank = 1
    for i, rec in enumerate(sorted_records):
        if i > 0 and rec["total_marks"] < sorted_records[i - 1]["total_marks"]:
            current_rank = i + 1
        rec["rank"] = current_rank

    # Calculate class-level statistics & analytics
    all_scores = [s["total_marks"] for s in student_records if s["total_marks"] is not None]
    total_students = len(student_records)
    
    mean_score = 0.0
    median_score = 0.0
    highest_score = 0.0
    lowest_score = 0.0
    std_dev = 0.0
    pass_count = sum(1 for s in student_records if s["is_passed"])
    at_risk_count = sum(1 for s in student_records if s["is_at_risk"])

    if all_scores:
        mean_score = sum(all_scores) / len(all_scores)
        sorted_scores = sorted(all_scores)
        n = len(sorted_scores)
        if n % 2 == 1:
            median_score = sorted_scores[n // 2]
        else:
            median_score = (sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2.0
        
        highest_score = max(all_scores)
        lowest_score = min(all_scores)
        variance = sum((x - mean_score) ** 2 for x in all_scores) / n
        std_dev = math.sqrt(variance)

    pass_percentage = (pass_count / total_students * 100.0) if total_students > 0 else 0.0

    # Grade distribution
    grade_counts = {}
    for cutoff in grade_cutoffs:
        grade_counts[cutoff["grade"]] = 0
    for s in student_records:
        g = s["grade"]
        grade_counts[g] = grade_counts.get(g, 0) + 1

    grade_distribution = [
        {
            "grade": cutoff["grade"],
            "grade_point": cutoff["grade_point"],
            "description": cutoff["description"],
            "min_percentage": cutoff["min_percentage"],
            "count": grade_counts.get(cutoff["grade"], 0),
            "percentage": round_marks(grade_counts.get(cutoff["grade"], 0) / total_students * 100.0) if total_students > 0 else 0.0
        }
        for cutoff in sorted(grade_cutoffs, key=lambda x: x["min_percentage"], reverse=True)
    ]

    # Component-wise analytics (difficulty, average, completion)
    component_stats = []
    for comp in components:
        comp_id = comp["id"]
        comp_marks = []
        absent_count = 0
        missing_count = 0

        for s in students:
            m = marks_map.get((s["id"], comp_id))
            if not m:
                missing_count += 1
            elif m.get("is_absent"):
                absent_count += 1
                comp_marks.append(0.0)
            elif m.get("marks_obtained") is not None:
                comp_marks.append(float(m["marks_obtained"]))

        c_mean = (sum(comp_marks) / len(comp_marks)) if comp_marks else 0.0
        c_max = max(comp_marks) if comp_marks else 0.0
        c_min = min(comp_marks) if comp_marks else 0.0
        c_avg_pct = (c_mean / comp["max_marks"] * 100.0) if comp["max_marks"] > 0 else 0.0

        component_stats.append({
            "component_id": comp_id,
            "component_name": comp["name"],
            "code": comp["code"],
            "max_marks": comp["max_marks"],
            "group_id": comp["group_id"],
            "count_submitted": len(comp_marks) - absent_count,
            "count_absent": absent_count,
            "count_missing": missing_count,
            "average_marks": round_marks(c_mean),
            "average_percentage": round_marks(c_avg_pct),
            "highest_marks": round_marks(c_max),
            "lowest_marks": round_marks(c_min)
        })

    # Group-wise average performance
    group_stats = []
    for grp in groups:
        grp_id = grp["id"]
        group_percentages = []
        for s in student_records:
            for g in s["groups"]:
                if g["group_id"] == grp_id:
                    if g["group_percentage"] is not None:
                        group_percentages.append(g["group_percentage"])
        
        g_avg = (sum(group_percentages) / len(group_percentages)) if group_percentages else 0.0
        group_stats.append({
            "group_id": grp_id,
            "group_name": grp["name"],
            "weightage_percent": grp["weightage_percent"],
            "rule_type": grp["rule_type"],
            "best_n_count": grp.get("best_n_count"),
            "class_average_percentage": round_marks(g_avg)
        })

    # Total weight check
    total_configured_weight = sum(float(g["weightage_percent"]) for g in groups)
    is_weight_valid = (abs(total_configured_weight - 100.0) < 0.01)

    return {
        "course_id": course["id"],
        "course_code": course["code"],
        "course_title": course["title"],
        "semester": course["semester"],
        "department": course["department"],
        "submission_status": course["submission_status"],
        "is_locked": bool(course["is_locked"]),
        "locked_at": course.get("locked_at"),
        "locked_by": course.get("locked_by"),
        "lock_reason": course.get("lock_reason"),
        "total_configured_weight": total_configured_weight,
        "is_weight_valid": is_weight_valid,
        "instructor_name": course.get("instructor_name"),
        "instructor_email": course.get("instructor_email"),
        "credits": course.get("credits", 4),
        "analytics": {
            "total_students": total_students,
            "mean_score": round_marks(mean_score),
            "median_score": round_marks(median_score),
            "std_dev": round_marks(std_dev),
            "highest_score": round_marks(highest_score),
            "lowest_score": round_marks(lowest_score),
            "pass_count": pass_count,
            "fail_count": total_students - pass_count,
            "pass_percentage": round_marks(pass_percentage),
            "at_risk_count": at_risk_count,
            "grade_distribution": grade_distribution,
            "group_stats": group_stats,
            "component_stats": component_stats
        },
        "students": student_records
    }
