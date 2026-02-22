from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv() 

MONGO_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("db")
SECRET = os.getenv("SECRET_KEY")