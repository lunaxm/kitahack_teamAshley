# app/routes/medgemma_api.py
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from app.services.prompt_builder import build_prognosis_prompt, build_treatment_prompt

router = APIRouter()
RUNPOD_URL = f"https://api.runpod.ai/v2/{os.getenv('RUNPOD_ENDPOINT_ID')}/runsync"

class PrognosisRequest(BaseModel):
    patient_id: str
    role: str = "general"
    current_details: dict
    image_base64: str = None

class TreatmentRequest(BaseModel):
    patient_id: str
    role: str = "general"
    confirmed_diagnosis: str
    current_details: dict

@router.post("/generate-prognosis")
async def get_ai_prognosis(request: Request, payload: PrognosisRequest):
    # 1. Fetch historical records from MongoDB
    db = request.app.database
    records_collection = db["ClinicalRecords"]
    history_cursor = records_collection.find({"patient_id": payload.patient_id}).sort("visit_date", -1)
    historical_records = await history_cursor.to_list(length=10)
    
    # 2. Build the strict prompt
    engineered_prompt = build_prognosis_prompt(
        role_key=payload.role,
        current_details=payload.current_details,
        historical_records=historical_records,
        has_image=bool(payload.image_base64)
    )
    
    # 3. Send to RunPod
    runpod_payload = {
        "input": {
            "prompt": engineered_prompt,
            "image_base64": payload.image_base64
        }
    }
    
    client = request.app.runpod_client
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    
    return {"status": "success", "prognosis_data": response.json()["output"]["medical_analysis"]}

@router.post("/generate-treatment")
async def get_ai_treatment(request: Request, payload: TreatmentRequest):
    # Fetch history again
    db = request.app.database
    historical_records = await db["ClinicalRecords"].find({"patient_id": payload.patient_id}).to_list(length=10)
    
    # Build the Stage 2 prompt
    engineered_prompt = build_treatment_prompt(
        role_key=payload.role,
        confirmed_diagnosis=payload.confirmed_diagnosis,
        current_details=payload.current_details,
        historical_records=historical_records
    )
    
    # Send to RunPod (No image needed for the treatment generation step)
    runpod_payload = {"input": {"prompt": engineered_prompt, "image_base64": None}}
    
    client = request.app.runpod_client
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    
    return {"status": "success", "treatment_plan": response.json()["output"]["medical_analysis"]}