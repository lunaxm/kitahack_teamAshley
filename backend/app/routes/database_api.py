import os
import base64
import requests
import sys
# Add the current directory and the parent directory to the path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "app"))
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, APIRouter, Depends, Header, Request, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
# from app.services.database import get_stats, db_search_patients, db_delete_patient, db_get_debug_data
import app.services.database as db_layer
from app.services.dependencies import get_database
from app.model.models import GatewayRequest, PatientCreateRequest

load_dotenv()

router = APIRouter()
@router.post("/patients")
async def add_patient_record(patient_data: dict, db=Depends(get_database)):
    patients_collection = db["Patients"]
    result = await patients_collection.insert_one(patient_data)
    return result
    

# CRUD Operations
async def create(role: str, event: str, data: dict):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: Only Admins can create records.")

    if event == "CREATE_PATIENT":
        patient_obj = PatientCreateRequest(**data)
        result = await db_layer.db_create_patient(patient_obj.dict())
        return {"status": "SUCCESS", "msg": "Patient record initialized", "id": str(result.inserted_id)}
    
    raise HTTPException(status_code=400, detail="Invalid Creation Event")


async def read(role: str, event: str, patient_id: str):
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required for read operations")

    history_data = await db_layer.db_get_patient_history(patient_id)
    if not history_data or not history_data.get("history"):
        raise HTTPException(status_code=404, detail="No clinical history found.")

    latest_record = history_data["history"][0]

    if role == "pharmacist":
        if event == "GET_PRESCRIPTION":
            return {"status": "SUCCESS", "data": latest_record.get("clinical_record", {}).get("treatment")}
        raise HTTPException(status_code=403, detail="Pharmacists can only access prescriptions.")

    if role == "doctor":
        if event == "GET_PROGNOSIS":
            return {"status": "SUCCESS", "data": latest_record.get("clinical_record", {}).get("ai_prognosis")}
        return {"status": "SUCCESS", "data": latest_record}

    raise HTTPException(status_code=403, detail=f"Role {role} not authorized for reading this data.")


async def update(role: str, event: str, record_id: str, data: dict):#
    if not record_id:
        raise HTTPException(status_code=400, detail="record_id is required for update operations")

    update_fields = {}

    if role == "admin":
        if event == "UPDATE_PATIENT_INFO":
            update_fields = data 
        else:
            raise HTTPException(status_code=403, detail="Admin can only update general record info.")

    elif role == "medical_tech":
        if event == "UPDATE_LABS":
            update_fields = {
                "clinical_record.imaging": data.get("imaging"),
                "clinical_record.biomarkers": data.get("biomarkers")
            }
        else:
            raise HTTPException(status_code=403, detail="Medical Tech can only update scans/imaging/biomarkers.")

    elif role == "doctor":
        if event == "INPUT_DIAGNOSIS":
            update_fields = {"clinical_record.diagnosis": data}
        elif event == "MODIFY_PROGNOSIS":
            update_fields = {"clinical_record.ai_prognosis.doctor_confirmation": data}
        elif event == "UPDATE_TREATMENT":
            update_fields = {"clinical_record.treatment": data}
        else:
            raise HTTPException(status_code=403, detail="Invalid Doctor update event.")

    else:
        raise HTTPException(status_code=403, detail=f"Role {role} is not authorized to update records.")

    await db_layer.db_update_record(record_id, update_fields)
    return {"status": "SUCCESS", "msg": f"{event} completed successfully."}


# The System Getaway
@router.post("/gateway")
async def system_gateway(payload: GatewayRequest, role: str = Header(None)):    
    event = payload.event.upper()
    payload = await requests.request.json()
    
    # Logic to route based on Operation Type
    if event.startswith("CREATE"):
        return await create(role, event, payload.data)
    
    if event.startswith("GET"):
        return await read(role, event, payload.patient_id)
    
    if event.startswith("UPDATE") or event.startswith("INPUT") or event.startswith("MODIFY"):
        return await update(role, event, payload.record_id, payload.data)

    raise HTTPException(status_code=400, detail="Unknown operation category.")



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

