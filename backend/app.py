"""
Flask application – Smart Student Management & Performance Analysis System.
"""
import os
import io
import csv
from flask import Flask, request, jsonify, Response, session, send_from_directory
from flask_cors import CORS
from bson import ObjectId
from db import get_students_collection, get_users_collection
from utils import enrich_student

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.secret_key = "dev-secret-key-change-in-production"
CORS(app, supports_credentials=True)


# ──────────────────────────────────────────────
# SERVE FRONTEND
# ──────────────────────────────────────────────
@app.route("/")
def serve_login():
    return send_from_directory(FRONTEND_DIR, "login.html")


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

students = get_students_collection()
users = get_users_collection()


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def serialize(doc):
    """Convert MongoDB document to JSON-safe dict."""
    doc["_id"] = str(doc["_id"])
    return doc


def seed_default_user():
    """Create a default admin user if none exists."""
    if users.count_documents({}) == 0:
        users.insert_one({"username": "admin", "password": "admin123"})


seed_default_user()


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users.find_one({
        "username": data.get("username"),
        "password": data.get("password"),
    })
    if user:
        session["user"] = data["username"]
        return jsonify({"message": "Login successful", "username": data["username"]}), 200
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"}), 200


# ──────────────────────────────────────────────
# STUDENTS CRUD
# ──────────────────────────────────────────────
@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.json
    required = ["name", "roll_no", "marks", "attendance"]
    for field in required:
        if field not in data or data[field] in (None, ""):
            return jsonify({"error": f"'{field}' is required"}), 400

    # Check unique roll_no
    if students.find_one({"roll_no": int(data["roll_no"])}):
        return jsonify({"error": "Roll number already exists"}), 409

    data["roll_no"] = int(data["roll_no"])
    data["marks"] = int(data["marks"])
    data["attendance"] = int(data["attendance"])
    data = enrich_student(data)

    result = students.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return jsonify(data), 201


@app.route("/api/students", methods=["GET"])
def get_students():
    query = {}
    search = request.args.get("search", "").strip()
    grade_filter = request.args.get("grade", "").strip()
    status_filter = request.args.get("status", "").strip()
    attendance_filter = request.args.get("attendance", "").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 25))

    if search:
        try:
            roll = int(search)
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"roll_no": roll},
            ]
        except ValueError:
            query["name"] = {"$regex": search, "$options": "i"}

    if grade_filter:
        query["grade"] = grade_filter
    if status_filter:
        query["status"] = status_filter
    if attendance_filter:
        if attendance_filter == "90+":
            query["attendance"] = {"$gte": 90}
        elif attendance_filter == "75-89":
            query["attendance"] = {"$gte": 75, "$lt": 90}
        elif attendance_filter == "<75":
            query["attendance"] = {"$lt": 75}

    sort_field = request.args.get("sort", "roll_no")
    sort_dir = -1 if request.args.get("order", "asc") == "desc" else 1

    total = students.count_documents(query)
    docs = list(
        students.find(query)
        .sort(sort_field, sort_dir)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    return jsonify({
        "students": [serialize(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    })


@app.route("/api/students/<sid>", methods=["GET"])
def get_student(sid):
    doc = students.find_one({"_id": ObjectId(sid)})
    if not doc:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(serialize(doc))


@app.route("/api/students/<sid>", methods=["PUT"])
def update_student(sid):
    data = request.json
    data["roll_no"] = int(data.get("roll_no", 0))
    data["marks"] = int(data.get("marks", 0))
    data["attendance"] = int(data.get("attendance", 0))
    data = enrich_student(data)
    data.pop("_id", None)

    result = students.update_one({"_id": ObjectId(sid)}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Student not found"}), 404
    updated = students.find_one({"_id": ObjectId(sid)})
    return jsonify(serialize(updated))


@app.route("/api/students/<sid>", methods=["DELETE"])
def delete_student(sid):
    result = students.delete_one({"_id": ObjectId(sid)})
    if result.deleted_count == 0:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"message": "Deleted successfully"})


# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    pipeline_stats = list(students.aggregate([
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "avg_marks": {"$avg": "$marks"},
            "avg_attendance": {"$avg": "$attendance"},
            "max_marks": {"$max": "$marks"},
        }}
    ]))

    stats = pipeline_stats[0] if pipeline_stats else {
        "total": 0, "avg_marks": 0, "avg_attendance": 0, "max_marks": 0,
    }
    stats.pop("_id", None)
    stats["avg_marks"] = round(stats.get("avg_marks") or 0, 1)
    stats["avg_attendance"] = round(stats.get("avg_attendance") or 0, 1)

    # Topper
    topper_doc = students.find_one(sort=[("marks", -1)])
    stats["topper"] = serialize(topper_doc) if topper_doc else None

    # Pass / Fail counts
    pass_count = students.count_documents({"grade": {"$ne": "Fail"}})
    fail_count = students.count_documents({"grade": "Fail"})
    stats["pass_count"] = pass_count
    stats["fail_count"] = fail_count

    # At-risk count
    stats["at_risk_count"] = students.count_documents({"status": "At Risk"})

    # At-risk list (top 5)
    at_risk = list(students.find({"status": "At Risk"}).sort("marks", 1).limit(5))
    stats["at_risk_students"] = [serialize(s) for s in at_risk]

    return jsonify(stats)


# ──────────────────────────────────────────────
# ANALYTICS
# ──────────────────────────────────────────────
@app.route("/api/analytics", methods=["GET"])
def analytics():
    # Grade distribution
    grade_dist = list(students.aggregate([
        {"$group": {"_id": "$grade", "count": {"$sum": 1}}}
    ]))

    # Marks distribution buckets
    marks_buckets = list(students.aggregate([
        {"$bucket": {
            "groupBy": "$marks",
            "boundaries": [0, 20, 40, 60, 80, 101],
            "default": "Other",
            "output": {"count": {"$sum": 1}},
        }}
    ]))

    # Top 5 performers
    top5 = [serialize(s) for s in students.find().sort("marks", -1).limit(5)]
    # Bottom 5
    bottom5 = [serialize(s) for s in students.find().sort("marks", 1).limit(5)]

    # Scatter data (marks vs attendance)
    scatter = [
        {"name": s["name"], "marks": s["marks"], "attendance": s["attendance"], "status": s["status"]}
        for s in students.find({}, {"name": 1, "marks": 1, "attendance": 1, "status": 1, "_id": 0})
    ]

    # Risk breakdown
    risk_breakdown = {
        "low_marks": students.count_documents({"marks": {"$lt": 50}, "attendance": {"$gte": 75}}),
        "low_attendance": students.count_documents({"marks": {"$gte": 50}, "attendance": {"$lt": 75}}),
        "both": students.count_documents({"marks": {"$lt": 50}, "attendance": {"$lt": 75}}),
        "safe": students.count_documents({"status": "Safe"}),
    }

    return jsonify({
        "grade_distribution": {item["_id"]: item["count"] for item in grade_dist},
        "marks_distribution": [
            {"range": "0-19",   "count": next((b["count"] for b in marks_buckets if b["_id"] == 0),   0)},
            {"range": "20-39",  "count": next((b["count"] for b in marks_buckets if b["_id"] == 20),  0)},
            {"range": "40-59",  "count": next((b["count"] for b in marks_buckets if b["_id"] == 40),  0)},
            {"range": "60-79",  "count": next((b["count"] for b in marks_buckets if b["_id"] == 60),  0)},
            {"range": "80-100", "count": next((b["count"] for b in marks_buckets if b["_id"] == 80),  0)},
        ],
        "top_performers": top5,
        "bottom_performers": bottom5,
        "scatter": scatter,
        "risk_breakdown": risk_breakdown,
    })


# ──────────────────────────────────────────────
# EXPORT
# ──────────────────────────────────────────────
@app.route("/api/export", methods=["POST"])
def export_csv():
    all_students = list(students.find())
    si = io.StringIO()
    writer = csv.writer(si)
    writer.writerow(["Roll No", "Name", "Marks", "Attendance", "Grade", "Status"])
    for s in all_students:
        writer.writerow([s["roll_no"], s["name"], s["marks"], s["attendance"], s["grade"], s["status"]])

    output = si.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=students_export.csv"},
    )


# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
