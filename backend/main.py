import os
import base64
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="kitahack_teamAshley Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Secure this to your React app's domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
# Use the synchronous runsync endpoint for immediate UI feedback
RUNPOD_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/runsync" 

@app.post("/api/analyze")
async def analyze_medical_media(
    question: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        # Read the raw file bytes and encode to Base64
        file_bytes = await file.read()
        base64_encoded_image = base64.b64encode(file_bytes).decode('utf-8')
        
        # MedGemma 1.5 Prompt Engineering:
        # We explicitly instruct the model to use <think> tags for its clinical reasoning
        engineered_prompt = f"""You are a clinical AI assistant.
<instructions>
1. Analyze the provided image to answer the user's question: {question}
2. You must output your clinical reasoning step-by-step enclosed in <think> and </think> tags.
3. Provide your final concise answer after the reasoning block.
</instructions>"""

        payload = {
            "input": {
                "prompt": engineered_prompt,
                "image_base64": base64_encoded_image
            }
        }

        headers = {
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        }

        # Send the payload to your GPU worker
        response = requests.post(RUNPOD_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        # RunPod nests your handler's return dictionary inside 'output'
        result = response.json()
        return {"status": "success", "data": result.get("output")}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to communicate with RunPod: {str(e)}")
    

from fastapi import FastAPI, HTTPException, Query
from database import patients_collection
from models import Patient
from bson.objectid import ObjectId
import re # For partial name search

app = FastAPI()

# GET PATIENTS (Search by ID, Name, or Get All)
@app.get("/patients")
def get_patients(
    patient_id: str | None = Query(default=None),
    name: str | None = Query(default=None)
):
    query = {}
    
    # If searching by name
    if name:
        query["patient_info.name"] = {"$regex": name, "$options": "i"}
    
    # If searching by ID 
    if patient_id:
        query["patient_info.id"] = patient_id

    patients = []

    for patient in patients_collection.find(query):
        patients.append({
            "id": str(patient["_id"]),
            "patient_info": patient.get("patient_info"),
            "clinical_record": patient.get("clinical_record") # Included for the Dr. UI
        })

    if not patients:
        return {"message": "No patients found", "data": []}

    return {"count": len(patients), "data": patients}


# DASHBOARD DATA 
@app.get("/dashboard")
def get_dashboard_data():
    # A. Total Patients
    total = patients_collection.count_documents({})
    
    # B. High Risk Patients (Probability > 0.70)
    high_risk = patients_collection.count_documents({
        "clinical_record.ai_prognosis.probability": {"$gt": 0.70}
    })
    
    # C. Pending Diagnoses
    pending = patients_collection.count_documents({
        "clinical_record.diagnosis.status": {"$in": ["Pending", "In Progress", "Critical"]}
    })
    
    # D. Generate Alerts 
    alerts = []
    for p in patients_collection.find():
        biomarkers = p.get("clinical_record", {}).get("biomarkers", "").lower()
        if "mutation" in biomarkers or "pathogenic" in biomarkers:
            alerts.append({
                "patient": p["patient_info"]["name"],
                "message": f"AI detected abnormal biomarkers for {p['patient_info']['name']}",
                "severity": "HIGH"
            })

    return {
        "stats": {
            "total_patients": total,
            "high_risk": high_risk,
            "pending_diagnoses": pending,
            "accuracy": "94%",
            "treatment_success": "89%"
        },
        "alerts": alerts[:4] # Return top 4 for the UI
    }


# CREATE NEW PATIENT
@app.post("/patients")
def create_patient(patient: Patient):
    existing = patients_collection.find_one({"patient_info.id": patient.id})
    if existing:
        raise HTTPException(status_code=400, detail="Patient ID already exists")

    new_patient = {
        "patient_info": { "id": patient.id, "name": patient.name },
        "clinical_record": {
            "biomarkers": "",
            "diagnosis": {"status": "Pending"},
            "ai_prognosis": {"probability": 0.0}
        }
    }
    result = patients_collection.insert_one(new_patient)
    return {"message": "Patient created", "id": str(result.inserted_id)}


# UPDATE PATIENT
@app.put("/patients/{patient_id}")
def update_patient(patient_id: str, patient: Patient):
    result = patients_collection.update_one(
        {"patient_info.id": patient_id},
        {"$set": {"patient_info.name": patient.name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Updated successfully"}


# DELETE PATIENT
@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):
    result = patients_collection.delete_one({"patient_info.id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": f"Patient {patient_id} deleted"}


# DEBUG
@app.get("/debug/all")
def debug_all():
    data = []
    for doc in patients_collection.find():
        doc["_id"] = str(doc["_id"])
        data.append(doc)

    return {
        "count": len(data),
        "data": data
    }