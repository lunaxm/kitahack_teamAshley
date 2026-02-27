import os
import base64
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, APIRouter, Depends, Header, Request, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# from app.services.database import get_stats, db_search_patients, db_delete_patient, db_get_debug_data
from app.services import database as db_layer
from app.services.dependencies import get_database

load_dotenv()

router = APIRouter()
@router.post("/patients")
async def add_patient_record(patient_data: dict, db=Depends(get_database)):
    patients_collection = db["Patients"]
    result = await patients_collection.insert_one(patient_data)
    return result
    

# The System Getaway
@router.post("/api/gateway")
async def system_gateway(request: Request, background_tasks: BackgroundTasks, role: str = Header(None)):    
    payload = await request.json()
    event = payload.get("event", "UNKNOWN").upper()
    p_id = payload.get("patient_id")
    rec_id = payload.get("record_id")
    raw_data = payload.get("data", {})

    # Role: Admin
    if role == "admin":
        if event == "CREATE_PATIENT":
            await db_layer.db_create_patient(raw_data)
            return {"status": "SUCCESS", "msg": "Admin: Patient record created."}
        
    # Role: Medical Tech
    elif role == "medical_tech":
        if event == "UPDATE_LABS":
            update = {
                "clinical_record.imaging": raw_data.get("imaging"),
                "clinical_record.biomarkers": raw_data.get("biomarkers")
            }
            await db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "MedTech: Lab data updated."}

    # Role: Doctor
    elif role == "doctor":
        if event == "RUN_PROGNOSIS":
            # AI simulation, but using input data for now
            update = {"clinical_record.diagnosis.name": raw_data.get("diagnosis")}
            await db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "Doctor: AI Prognosis Generated."}
        
        elif event == "UPDATE_TREATMENT":
            update = {"clinical_record.treatment": raw_data}
            await db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "Doctor: Treatment plan updated."}

    # Role: Pharmacist
    elif role == "pharmacist":
        if event == "GET_PRESCRIPTION":
            history_data = await db_layer.db_get_patient_history(p_id)
        if history_data["history"]:
            return {"status": "SUCCESS", "data": history_data["history"][0].get("clinical_record", {}).get("treatment")}
        return {"status": "ERROR", "msg": "No prescription found."}
    
    raise HTTPException(status_code=403, detail="Unauthorized role or event.")


# Run AI Prognosis in background 
async def run_ai_batch_analysis(patient_id: str, record_id: str):
    print(f"AI Batch Process started for {patient_id}")
    
    import asyncio
    await asyncio.sleep(5) # Wait for 5 seconds
    
    ai_results = {"probability": 0.88, "outcome": "High Risk Detected"}
    
    await db_layer.db_update_record(record_id, {"clinical_record.ai_prognosis": ai_results})
    print(f"AI Batch Process completed for {patient_id}")


# Dashboard
@router.get("/api/dashboard")
async def dashboard(role: str = Header(None)):
    print(f"DEBUG: The role received from the frontend is: [{role}]")
    if role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Dashboard access denied.")
    return await db_layer.get_stats()


# Search Patient
@router.get("/api/patients/search")
async def search_patient(query: str = Query(...), role: str = Header(None)):
    if role not in ["admin", "doctor", "medical_tech"]:
        raise HTTPException(status_code=403, detail="Search denied.")
    
    data = await db_layer.db_search_patients(query)

    if data is None:
        raise HTTPException(status_code=404, detail="No patient found.")   
    
    return {"status": "SUCCESS", "data": data}


# Delete patient record
@router.delete("/api/patients/{p_id}")
async def delete_patient(p_id: str, role: str = Header(None)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete.")
    return await db_layer.db_delete_patient(p_id)