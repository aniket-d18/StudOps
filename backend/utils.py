"""
Business logic for grade calculation and at-risk detection.
"""


def calculate_grade(marks):
    """Assign grade based on marks.
    90+  → A
    75–89 → B
    50–74 → C
    <50  → Fail
    """
    if marks >= 90:
        return "A"
    elif marks >= 75:
        return "B"
    elif marks >= 50:
        return "C"
    else:
        return "Fail"


def calculate_status(marks, attendance):
    """Determine at-risk status.
    Marks < 50 OR Attendance < 75% → 'At Risk'
    Otherwise → 'Safe'
    """
    if marks < 50 or attendance < 75:
        return "At Risk"
    return "Safe"


def enrich_student(data):
    """Add computed grade and status fields to a student dict."""
    marks = int(data.get("marks", 0))
    attendance = int(data.get("attendance", 0))
    data["grade"] = calculate_grade(marks)
    data["status"] = calculate_status(marks, attendance)
    return data
