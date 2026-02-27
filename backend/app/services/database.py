import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv

# load_dotenv()

# # Credentials
# MONGO_URI = os.getenv("MONGODB_URL")
# DB_NAME = os.getenv("db").strip()
# SECRET = os.getenv("SECRET_KEY")

# client = MongoClient(MONGO_URI)
# db = client[DB_NAME]
# patients_collection = db["Patients"]
# records_collection = db["ClinicalRecords"]

# print(f"Database connection established successfully.")

# Dashboard Logic 
def get_stats():
    total_pts = patients_collection.count_documents({})
    
    # Count visits with high probability in the Records collection
    high_risk = records_collection.count_documents({
        "clinical_record.ai_prognosis.probability": {"$gt": 0.70}
    })
    
    # Count visits waiting for doctor action
    pending = records_collection.count_documents({
        "clinical_record.diagnosis.status": "Pending"
    })
    
    return {
        "total_patients": total_pts,
        "high_risk": high_risk,
        "pending_diagnoses": pending,
        "accuracy": "94%", 
        "treatment_success": "89%" 
    }

# Search Logic
def db_search_patients(term):
    query = {
        "$or": [
            {"_id": term}, 
            {"name": {"$regex": term, "$options": "i"}}
        ]
    }
    patients = list(patients_collection.find(query))

    if not patients:
        return None
    
    for p in patients:
        latest_visit = records_collection.find_one({"patient_id": p["_id"]}, sort=[("visit_date", -1)])
        p["latest_status"] = latest_visit["clinical_record"]["diagnosis"]["status"] if latest_visit else "No Visit"
    return patients

# CRUD Operations
def db_create_patient(data):
    return patients_collection.insert_one(data)

def db_get_patient_history(p_id):
    patient = patients_collection.find_one({"_id": p_id})
    history = list(records_collection.find({"patient_id": p_id}).sort("visit_date", -1))
    for h in history: h["_id"] = str(h["_id"])
    return {"info": patient, "history": history}

def db_update_record(rec_id, update_fields):
    return records_collection.update_one({"record_id": rec_id}, {"$set": update_fields})

def db_delete_patient(p_id):
    res1 = patients_collection.delete_one({"_id": p_id})
    res2 = records_collection.delete_many({"patient_id": p_id})
    return {"success": res1.deleted_count > 0, "records_purged": res2.deleted_count}
