# app/routes/medgemma_api.py
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import asyncio
import asyncio
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from app.services.prompt_builder import build_prognosis_prompt, build_treatment_prompt, parse_prognosis_text_to_json

router = APIRouter()
RUNPOD_URL = f"https://api.runpod.ai/v2/{os.getenv('RUNPOD_ENDPOINT_ID')}/run"
RUNPOD_STATUS_URL = f"https://api.runpod.ai/v2/{os.getenv('RUNPOD_ENDPOINT_ID')}/status" # <--- ADD THIS URL
=======
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from app.services.prompt_builder import build_prognosis_prompt, build_treatment_prompt

router = APIRouter()
RUNPOD_URL = f"https://api.runpod.ai/v2/{os.getenv('RUNPOD_ENDPOINT_ID')}/runsync"
>>>>>>> Stashed changes

class PrognosisRequest(BaseModel):
    patient_id: str
    role: str = "general"
    current_details: dict
    image_base64: str = None

=======
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

>>>>>>> Stashed changes
class TreatmentRequest(BaseModel):
    patient_id: str
    role: str = "general"
    confirmed_diagnosis: str
    current_details: dict

@router.post("/generate-prognosis")
async def get_ai_prognosis(request: Request, payload: PrognosisRequest):
    # 1. Fetch historical records from MongoDB
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    # db = request.app.database
    # records_collection = db["ClinicalRecords"]
    # history_cursor = records_collection.find({"patient_id": payload.patient_id}).sort("visit_date", -1)
    # historical_records = await history_cursor.to_list(length=10)
=======
=======
>>>>>>> Stashed changes
    db = request.app.database
    records_collection = db["ClinicalRecords"]
    history_cursor = records_collection.find({"patient_id": payload.patient_id}).sort("visit_date", -1)
    historical_records = await history_cursor.to_list(length=10)
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    
    # 2. Build the strict prompt
    engineered_prompt = build_prognosis_prompt(
        role_key=payload.role,
        current_details=payload.current_details,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        historical_records=[],  # No historical records in this version
=======
        historical_records=historical_records,
>>>>>>> Stashed changes
=======
        historical_records=historical_records,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    # response = await client.post(RUNPOD_URL, json=runpod_payload)
    # response.raise_for_status()

    # # 4. Extract and Parse  
    # raw_llm_text = response.json()["output"]["medical_analysis"]
    # structured_json_array = parse_prognosis_text_to_json(raw_llm_text)
    
    # return {"status": "success", "prognosis_data": structured_json_array}
# 3. Initial Request to RunPod
    print("Sending job to RunPod...")
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    result_data = response.json()
    
    job_id = result_data.get("id")
    status = result_data.get("status")
    
    # 4. THE POLLING LOOP: Wait patiently if it's in the queue or processing
    while status in ["IN_QUEUE", "IN_PROGRESS"]:
        print(f"RunPod Job {job_id} is {status}. Waiting 5 seconds...")
        await asyncio.sleep(5) # Pause for 5 seconds without blocking the rest of the app
        
        # Check the status endpoint
        status_response = await client.get(f"{RUNPOD_STATUS_URL}/{job_id}")
        status_response.raise_for_status()
        result_data = status_response.json()
        status = result_data.get("status")

    # 5. Handle the Final Result
    if status == "COMPLETED":
        print("Job Complete! Extracting data...")
        raw_llm_text = result_data["output"]["medical_analysis"]
        structured_json_array = parse_prognosis_text_to_json(raw_llm_text) # Your text parser
        
        return {
            "status": "success", 
            "prognosis_data": structured_json_array
        }
    else:
        # If it returns FAILED or something else
        print(f"RunPod Error Data: {result_data}")
        raise HTTPException(status_code=500, detail=f"RunPod job failed with status: {status}")

=======
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    
    return {"status": "success", "prognosis_data": response.json()["output"]["medical_analysis"]}

>>>>>>> Stashed changes
=======
    response = await client.post(RUNPOD_URL, json=runpod_payload)
    response.raise_for_status()
    
    return {"status": "success", "prognosis_data": response.json()["output"]["medical_analysis"]}

>>>>>>> Stashed changes
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