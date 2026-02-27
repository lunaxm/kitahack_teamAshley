# app/routes/medgemma_api.py
import asyncio
import os
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.services.prompt_builder import (
    build_prognosis_prompt, 
    build_treatment_prompt, 
    parse_prognosis_text_to_json
)

router = APIRouter()

# Use the async polling endpoints to prevent timeouts
RUNPOD_ENDPOINT_ID = os.getenv('RUNPOD_ENDPOINT_ID')
RUNPOD_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"
RUNPOD_STATUS_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status"

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


async def poll_runpod_job(client, job_id: str):
    """Helper function to handle the polling loop for RunPod jobs."""
    status = "IN_QUEUE"
    
    while status in ["IN_QUEUE", "IN_PROGRESS"]:
        print(f"RunPod Job {job_id} is {status}. Waiting 5 seconds...", flush=True)
        await asyncio.sleep(5) 
        
        status_response = await client.get(f"{RUNPOD_STATUS_URL}/{job_id}")
        status_response.raise_for_status()
        result_data = status_response.json()
        status = result_data.get("status")

    if status == "COMPLETED":
        print("Job Complete! Extracting data...", flush=True)
        return result_data["output"]["medical_analysis"]
    else:
        print(f"RunPod Error Data: {result_data}")
        raise HTTPException(status_code=500, detail=f"RunPod job failed with status: {status}", flush=True)


@router.post("/generate-prognosis")
async def get_ai_prognosis(request: Request, payload: PrognosisRequest):
    print(f"Generate prognosis route triggered.", flush=True)
    # 1. Fetch historical records
    db = request.app.database
    records_collection = db["ClinicalRecords"] # Ensure this matches your DB exactly
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
    print("Sending prognosis job to RunPod...", flush=True)
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    
    job_id = response.json().get("id")
    
    # 4. Wait for the result using the helper function
    raw_llm_text = await poll_runpod_job(client, job_id)
    
    # 5. Parse and Return
    structured_json_array = parse_prognosis_text_to_json(raw_llm_text)
    
    return {
        "status": "success", 
        "prognosis_data": structured_json_array
    }


@router.post("/generate-treatment")
async def get_ai_treatment(request: Request, payload: TreatmentRequest):
    # 1. Fetch historical records
    db = request.app.database
    records_collection = db["ClinicalRecords"]
    historical_records = await records_collection.find({"patient_id": payload.patient_id}).to_list(length=10)
    
    # 2. Build the Stage 2 prompt
    engineered_prompt = build_treatment_prompt(
        role_key=payload.role,
        confirmed_diagnosis=payload.confirmed_diagnosis,
        current_details=payload.current_details,
        historical_records=historical_records
    )
    
    # 3. Send to RunPod
    runpod_payload = {"input": {"prompt": engineered_prompt, "image_base64": None}}
    
    client = request.app.runpod_client
    print("Sending treatment job to RunPod...")
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    
    job_id = response.json().get("id")
    
    # 4. Wait for the result using the helper function
    raw_llm_text = await poll_runpod_job(client, job_id)
    
    return {
        "status": "success", 
        "treatment_plan": raw_llm_text
    }