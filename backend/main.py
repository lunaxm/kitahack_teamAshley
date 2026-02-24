import os
import base64
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.services.database import get_stats, db_search_patients, db_delete_patient, db_get_debug_data
import app.services.database as db_layer

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
    

# The System Getaway
@app.post("/api/gateway")
async def system_gateway(request: Request, role: str = Header(None)):
    payload = await request.json()
    event = payload.get("event", "UNKNOWN").upper()
    p_id = payload.get("patient_id")
    rec_id = payload.get("record_id")
    raw_data = payload.get("data", {})

    # Role: Admin
    if role == "admin":
        if event == "CREATE_PATIENT":
            db_layer.db_create_patient(raw_data)
            return {"status": "SUCCESS", "msg": "Admin: Patient record created."}
        
    # Role: Medical Tech
    elif role == "medical_tech":
        if event == "UPDATE_LABS":
            update = {
                "clinical_record.imaging": raw_data.get("imaging"),
                "clinical_record.biomarkers": raw_data.get("biomarkers")
            }
            db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "MedTech: Lab data updated."}

    # Role: Doctor
    elif role == "doctor":
        if event == "RUN_PROGNOSIS":
            # AI simulation, but using input data for now
            update = {
                "clinical_record.diagnosis.name": raw_data.get("diagnosis"),
                "clinical_record.ai_prognosis": {"probability": 0.88, "outcome": "AI Analyzed"}
            }
            db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "Doctor: AI Prognosis Generated."}
        
        elif event == "UPDATE_TREATMENT":
            update = {"clinical_record.treatment": raw_data}
            db_layer.db_update_record(rec_id, update)
            return {"status": "SUCCESS", "msg": "Doctor: Treatment plan updated."}

    # Role: Pharmacist
    elif role == "pharmacist":
        if event == "GET_PRESCRIPTION":
            history = db_layer.db_get_patient_history(p_id)
            return {"status": "SUCCESS", "data": history["history"][0].get("clinical_record", {}).get("treatment")}

    raise HTTPException(status_code=403, detail="Unauthorized role or event.")

# Run AI Prognosis in background 
async def run_ai_batch_analysis(patient_id: str, record_id: str):
    print(f"AI Batch Process started for {patient_id}")
    
    import asyncio
    await asyncio.sleep(5) # Wait for 5 seconds
    
    ai_results = {"probability": 0.88, "outcome": "High Risk Detected"}
    db_layer.db_update_record(record_id, {"clinical_record.ai_prognosis": ai_results})
    print(f"AI Batch Process completed for {patient_id}")

# Update gateway to trigger the batch process
@app.post("/api/gateway")
async def gateway(request: Request, background_tasks: BackgroundTasks, role: str = Header(None)):
    payload = await request.json()
    event = payload.get("event")
    p_id = payload.get("patient_id")
    rec_id = payload.get("record_id")

    if event == "RUN_PROGNOSIS" and role == "doctor":
        background_tasks.add_task(run_ai_batch_analysis, p_id, rec_id)
        
        return {
            "status": "PROCESSING",
            "message": "AI analysis has started in the background. Dashboard will update shortly."
        }

# Dashboard
@app.get("/api/dashboard")
async def dashboard(role: str = Header(None)):
    if role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Dashboard access denied.")
    return db_layer.get_stats()

# Search Patient
@app.get("/api/patients/search")
async def search_patient(query: str = Query(...), role: str = Header(None)):
    if role not in ["admin", "doctor", "medical_tech"]:
        raise HTTPException(status_code=403, detail="Search denied.")
    
    data = db_layer.db_search_patients(query)

    if data is None:
        raise HTTPException(status_code=404, detail="No patient found.")   
    
    return {"status": "SUCCESS", "data": data}

# Delete patient record
@app.delete("/api/patients/{p_id}")
async def delete_patient(p_id: str, role: str = Header(None)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete.")
    return db_layer.db_delete_patient(p_id)

# Debug
@app.get("/api/debug/all")
async def debug(role: str = Header(None)):
    if role != "admin": raise HTTPException(status_code=403)
    return db_layer.db_get_debug_data()

@app.get("/test-config")
async def test_config():
    return {
        "endpoint_id_loaded": bool(RUNPOD_ENDPOINT_ID),
        "api_key_loaded": bool(RUNPOD_API_KEY),
        "hf_token_loaded": bool(os.getenv("HF_TOKEN"))
    }