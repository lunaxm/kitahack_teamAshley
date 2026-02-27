# backend/Dockerfile

# 1. Use a lightweight Python version
FROM python:3.11-slim

# 2. Set the working directory
WORKDIR /app

# 3. Copy requirements first (for caching)
COPY requirements.txt .

# 4. Install dependencies
RUN pip install --no-cache-dir -r requirements.txt huggingface_hub

# 1. Set up the Hugging Face Token for the build
ARG HF_TOKEN
ENV HF_TOKEN=$HF_TOKEN

# 2. Copy the download script and run it
COPY download_model.py .
RUN python download_model.py

# 5. Copy the rest of the code
COPY . .

# 6. Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]