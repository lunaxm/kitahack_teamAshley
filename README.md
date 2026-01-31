# kitahack_teamAshley

🤖 KitaHack Team Ashley - AI/ML Project
A full-stack AI application using React (Frontend), FastAPI (Backend), and TensorFlow/Scikit-Learn (Machine Learning). The entire stack is containerized with Docker for easy deployment and development.

📂 Project Structure
This project follows a "Science vs. Production" separation of concerns.

Plaintext
KITAHACK_TEAMASHLEY/
├── docker-compose.yml          # Orchestrates Frontend, Backend, and DB
├── README.md                   # You are here
│
├── backend/                    # 🐍 Python API & Machine Learning
│   ├── api/                    # API Endpoints (FastAPI)
│   │   ├── routes.py           # Defines /predict, /train endpoints
│   │   └── schemas.py          # Input/Output data validation
│   ├── data/                   # 💾 Raw datasets (GitIgnored)
│   ├── models/                 # 🧠 Trained .pkl/.h5 models (GitIgnored)
│   ├── notebooks/              # 📓 Jupyter Notebooks for experiments
│   ├── ml/                     # ML Logic (Training & Inference scripts)
│   ├── config.py               # Path configurations (Data/Model paths)
│   ├── main.py                 # Application Entry Point
│   ├── Dockerfile              # Python Environment (TensorFlow, Pandas, etc.)
│   └── requirements.txt        # Python Dependencies
│
└── frontend/                   # ⚛️ React Application
    ├── public/                 # Static assets (index.html, images)
    ├── src/                    # React Source Code
    ├── Dockerfile              # Node.js Environment
    └── package.json            # JS Dependencies
🚀 Quick Start
1. Prerequisites
Docker Desktop (running)

No local Python or Node.js installation required!

2. Run the Application
Start the entire stack with one command:

Bash
docker compose up
Frontend: http://localhost:3000

Backend API: http://localhost:8000

API Documentation: http://localhost:8000/docs

3. Rebuild (After adding new libraries)
If you modify requirements.txt or package.json, force a rebuild:

Bash
docker compose up -d --build
🧠 Machine Learning Workflow
We use a Hybrid Workflow: Train in Notebooks, Serve in API.

Phase 1: Experimentation (Jupyter)
Place your raw data (CSV/Images) in backend/data/.

Open a Jupyter Notebook in backend/notebooks/.

Load data, train your model (CNN, Random Forest, etc.).

Save the model to ../models/my_model.pkl.

Note: Files saved here automatically appear in the API container via Docker Volumes.

Phase 2: Production (FastAPI)
The API loads the model from backend/models/ using ml/inference.py.

React sends user input to POST /predict.

FastAPI returns the prediction JSON.
