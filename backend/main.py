import os
import base64
import requests
import certifi
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from app.routes.runpod_api import router as runpod_api_router
from app.routes.database_api import router as database_api_router
from app.routes.medgemma_api import router as medgemma_api_router
import httpx

load_dotenv()

# 1. Defined lifespan for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up the FastAPI application...", flush=True)
    # You can add any startup logic here (e.g., database connections, loading models into memory, etc.)

    print("Connecting to MongoDB...")
    MONGODB_URL = os.getenv("MONGO_URL")
    print(f"Using MongoDB URI: {MONGODB_URL}")
    app.mongodb_client = AsyncIOMotorClient(
        MONGODB_URL, tlsCAFile=certifi.where())

    try:
        # Verify connection by 
        await app.mongodb_client.admin.command('ping')
        print("Successfully connected to MongoDB!", flush=True)
    except Exception as e:
        print(f"MongoDB Cluster Connection failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to connect to the database")
    
    # Create the HTTP client for RunPod API calls and store it in the app state for reuse
    try:
        app.runpod_client = httpx.AsyncClient(
                headers={"Authorization": f"Bearer {os.getenv('RUNPOD_API_KEY')}"},
                timeout=120.0 # Give MedGemma plenty of time to generate tokens
            )
        print("HTTP client for RunPod API initialized successfully.", flush=True)
    except Exception as e:
        print(f"Failed to initialize HTTP client for RunPod API: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to initialize HTTP client for RunPod API")
    
    yield
    print("Shutting down the FastAPI application...", flush=True)
    # You can add any cleanup logic here (e.g., closing database connections, releasing resources, etc.)
    app.mongodb_client.close()
    print("MongoDB connection closed.", flush=True)

app = FastAPI(title="kitahack_teamAshley Gateway", lifespan=lifespan)
app.include_router(runpod_api_router, prefix = "/api/runpod")
app.include_router(database_api_router, prefix = "/api/database")
app.include_router(medgemma_api_router, prefix = "/api/medgemma")
