# this file is the entry point for your RunPod GPU worker. It defines a handler function that processes incoming jobs, and initializes the MedGemma model 
# with LoRA adapters when the worker starts up. The handler receives prompts and base64-encoded images, runs inference through the model, and returns 
# the generated medical analysis.
import runpod
import torch
import base64
import io
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText, BitsAndBytesConfig
from peft import PeftModel
import os
from dotenv import load_dotenv

# Declare globals so the handler can access them, but don't load them yet
processor = None
model = None

load_dotenv()

def initialize_medgemma():
    """Loads the base model, applies quantization, and merges LoRA adapters."""
    global processor, model
    
    # model_id = "google/medgemma-1.5-27b-it"
    # adapter_path = "../ml_data/saved_adapters"

    # CHANGE THIS from "google/..." to your local Docker folder
    model_id = os.getenv("MODEL_PATH")
    adapter_path = "./saved_adapters"
    
    print("Initializing MedGemma and loading into VRAM...")
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True
    )
    
    processor = AutoProcessor.from_pretrained(model_id)
    
    # 1. Load the Base Model FIRST with Quantization
    base_model = AutoModelForImageTextToText.from_pretrained(
        model_id, 
        quantization_config=bnb_config,
        device_map="auto"
    )
    
    # 2. Wrap the Base Model with your custom LoRA Adapters
    model = PeftModel.from_pretrained(base_model, adapter_path)
    
    print("MedGemma 27B + Adapters successfully loaded into VRAM.")

def handler(job):
    """Processes incoming jobs from the RunPod queue."""
    job_input = job["input"] 
    prompt_text = job_input.get("prompt", "")
    base64_string = job_input.get("image_base64")
    
    content_list = []
    
    if base64_string:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        content_list.append({"type": "image", "image": image})
        
    content_list.append({"type": "text", "text": prompt_text})
    messages = [{"role": "user", "content": content_list}]
    
    inputs = processor.apply_chat_template(
        messages, 
        add_generation_prompt=True, 
        tokenize=True, 
        return_dict=True, 
        return_tensors="pt"
    ).to(model.device, dtype=torch.bfloat16)
    
    input_len = inputs["input_ids"].shape[-1]
    
    with torch.inference_mode():
        outputs = model.generate(**inputs, max_new_tokens=512, do_sample=False)
        
    generated_tokens = outputs[0][input_len:]
    response_text = processor.decode(generated_tokens, skip_special_tokens=True)
    
    return {"medical_analysis": response_text}

# ---------------------------------------------------------
# Start the Serverless listener
# This ensures initialize_medgemma() runs EXACTLY once when the container boots
# ---------------------------------------------------------
if __name__ == "__main__":
    initialize_medgemma()
    runpod.serverless.start({"handler": handler})