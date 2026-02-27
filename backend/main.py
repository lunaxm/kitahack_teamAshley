import os
import certifi
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# App routers and database layer
from app.routes.runpod_api import router as runpod_api_router
from app.routes.database_api import router as database_api_router
from app.routes.medgemma_api import router as medgemma_api_router
from app.services.database import initialize_db

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up the FastAPI application...", flush=True)
    
    # ---------------------------------------------------------
    # 1. MongoDB Initialization
    # ---------------------------------------------------------
    MONGODB_URL = os.getenv("MONGO_URL")
    print(f"Using MongoDB URI: {MONGODB_URL}")
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())

    try:
        # Initialize global collections in database.py
        initialize_db(app.mongodb_client)
        
        # CRITICAL FIX: Attach the specific database to the app state
        # so request.app.database works in your route files!
        db_name = os.getenv("DB_NAME", "MedicalDB").strip()
        app.database = app.mongodb_client[db_name]
        
        print(f"Successfully connected to MongoDB ({db_name})!", flush=True)
    except Exception as e:
        print(f"MongoDB Cluster Connection failed: {e}", flush=True)
        raise RuntimeError("Failed to connect to the database")
    
    # ---------------------------------------------------------
    # 2. RunPod HTTP Client Initialization
    # ---------------------------------------------------------
    try:
        app.runpod_client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {os.getenv('RUNPOD_API_KEY')}"},
            timeout=120.0 # Polling might take a while, this timeout is good
        )
        print("HTTP client for RunPod API initialized successfully.", flush=True)
    except Exception as e:
        print(f"Failed to initialize HTTP client for RunPod API: {e}", flush=True)
        raise RuntimeError("Failed to initialize RunPod HTTP Client")
    
    yield # --- THE SERVER RUNS HERE ---
    
    # ---------------------------------------------------------
    # 3. Shutdown Cleanup
    # ---------------------------------------------------------
    print("Shutting down the FastAPI application...", flush=True)
    app.mongodb_client.close()
    
    # CRITICAL FIX: Safely close the async HTTP client
    if hasattr(app, "runpod_client"):
        await app.runpod_client.aclose()
        
    print("All connections closed safely.", flush=True)

# Initialize FastAPI
app = FastAPI(title="kitahack_teamAshley Gateway", lifespan=lifespan)

# CRITICAL FIX: Add CORS Middleware so your React frontend can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change "*" to your React domain (e.g., "http://localhost:3000") in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers
app.include_router(runpod_api_router, prefix="/runpod")
app.include_router(database_api_router, prefix="/database")
app.include_router(medgemma_api_router, prefix="/medgemma")

@app.get("/")
async def root():
    return {"message": "Welcome to the kitahack_teamAshley Gateway API!"}