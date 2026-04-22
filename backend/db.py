"""
Database connection helper module for MongoDB Atlas.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/student_db")

# tlsAllowInvalidCertificates fixes TLSV1_ALERT_INTERNAL_ERROR on Windows
# when Python's OpenSSL has certificate chain issues with Atlas
client = MongoClient(
    MONGO_URI,
    tlsAllowInvalidCertificates=True,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
)

db = client["student_db"]

students_collection = db["students"]
users_collection    = db["users"]

# Create indexes — wrapped so a network blip on startup doesn't crash the app
try:
    students_collection.create_index("roll_no", unique=True)
    students_collection.create_index("name")
except Exception as e:
    print(f"[WARN] Could not create indexes (will retry on next write): {e}")


def get_students_collection():
    return students_collection


def get_users_collection():
    return users_collection
