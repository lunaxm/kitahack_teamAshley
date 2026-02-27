import os
import re
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

client: AsyncIOMotorClient = None
db = None
records_collection = None
clinical_records = None
db_users = None

def initialize_db(app_client: AsyncIOMotorClient):
    global db, patients_collection, clinical_records, db_users  
    # db_name = os.getenv("db", "MedicalDB").strip()
    # db = client[db_name]
    # patients_collection = db["Patients"]
    # records_collection = db["Records"]

    client = app_client
    db_name = os.getenv("db", "MedicalDB").strip(' "\'')
    db = client[db_name]
    patients_collection = db["Patients"]
    clinical_records = db["Clinical_records"]
    db_users = db["Users"]

    print(f" Successfully initialized database: {db_name} with collections: Patients, Clinical_records, Users")

def close_df():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


# Dashboard Logic 
async def get_stats():
    total_pts = await patients_collection.count_documents({})
    
    # Count visits with high probability in the Records collection
    high_risk = await records_collection.count_documents({
        "clinical_record.ai_prognosis.probability": {"$gt": 0.70}
    })
    
    # Count visits waiting for doctor action
    pending = await records_collection.count_documents({
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
async def db_search_patients(term: str):
    query = {
        "$or": [
            {"_id": term}, 
            {"name": {"$regex": term, "$options": "i"}}
        ]
    }
    cursor = patients_collection.find(query)
    patients = await cursor.to_list(length=100)  

    if not patients:
        return None
    
    for p in patients:
        p["_id"] = str(p["_id"])
        latest_visit = await records_collection.find_one({"patient_id": p["_id"]}, sort=[("visit_date", -1)])
        p["latest_status"] = latest_visit["clinical_record"]["diagnosis"]["status"] if latest_visit else "No Visit"
    return patients

# CRUD Operations
async def db_create_patient(data: dict):
    return await patients_collection.insert_one(data)

async def db_get_patient_history(p_id: str):
    patient = await patients_collection.find_one({"_id": p_id})
    if patient:
        patient["_id"] = str(patient["_id"])

    history = []
    cursor = records_collection.find({"patient_id": p_id}).sort("visit_date", -1)
    async for record in cursor:
        record["_id"] = str(record["_id"])
        history.append(record)
    return {"info": patient, "history": history}

async def db_update_record(rec_id: str, update_fields: dict):
    return await records_collection.update_one({"record_id": rec_id}, {"$set": update_fields})

async def db_delete_patient(p_id: str):
    res1 = await patients_collection.delete_one({"_id": p_id})
    res2 = await records_collection.delete_many({"patient_id": p_id})
    return {"success": res1.deleted_count > 0, "records_purged": res2.deleted_count}
