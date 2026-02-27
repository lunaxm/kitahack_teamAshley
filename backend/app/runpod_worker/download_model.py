import os
from huggingface_hub import snapshot_download

# Get the token from the environment
hf_token = os.environ.get("HF_TOKEN")

print("Downloading MedGemma 27B weights to local cache...")

# This downloads the raw files directly into the /model_cache folder
snapshot_download(
    repo_id="google/medgemma-1.5-27b-it",
    local_dir="/model_cache",
    token=hf_token,
    ignore_patterns=["*.msgpack", "*.h5"] # We only need the safetensors
)

print("Download complete!")