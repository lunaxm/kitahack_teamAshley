import os
from fastapi import APIRouter, Request, HTTPException

router = APIRouter()

# Your RunPod Serverless Endpoint ID
ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID") 
RUNPOD_URL = f"https://api.runpod.ai/v2/{ENDPOINT_ID}/runsync"

@router.post("/predict")
async def get_medgemma_prediction(request: Request, user_data: dict):
    # 1. Format the payload exactly how your RunPod handler expects it
    payload = {
        "input": {
            "prompt": user_data.get("prompt", ""),
            # Add any other parameters your MedGemma model needs
        }
    }

    try:
        # 2. Use the persistent HTTP client from our lifespan startup
        client = request.app.runpod_client
        
        # 3. Send the request to RunPod
        response = await client.post(RUNPOD_URL, json=payload)
        response.raise_for_status() # Catches 401 Unauthorized, 500 errors, etc.
        
        # 4. Parse the result and return it to the React frontend
        runpod_data = response.json()
        
        if runpod_data.get("status") == "COMPLETED":
            return {"status": "success", "prediction": runpod_data["output"]}
        else:
            raise HTTPException(status_code=500, detail="Model failed to process request")

    except Exception as e:
        print(f"RunPod API Error: {e}")
        raise HTTPException(status_code=500, detail="Error communicating with MedGemma")