from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CRITICAL: Allow React (port 3000) to talk to Python (port 8000)
# Without this, your browser will block the connection (CORS error).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from your Python AI Backend!"}

@app.get("/api/data")
def get_data():
    return {"status": "success", "data": [1, 2, 3, 4, 5]}