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