import os
import base64
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# from app.services.database import get_stats, db_search_patients, db_delete_patient, db_get_debug_data
import app.services.database as db_layer
from app.services.dependencies import get_database

load_dotenv()

router = APIRouter()
@router.post("/patients")
async def add_patient_record(patient_data: dict, db=Depends(get_database)):
    patients_collection = db["Patients"]
    result = await patients_collection.insert_one(patient_data)
    return result
    