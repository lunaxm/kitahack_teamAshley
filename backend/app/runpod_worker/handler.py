import runpod
import torch
import base64
import io
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText, BitsAndBytesConfig

processor = None
model = None

def initialize_medgemma():
    """Loads the model into VRAM before the endpoint starts accepting traffic."""
    global processor, model
    model_id = "google/medgemma-1.5-27b-it"
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True
    )
    
    processor = AutoProcessor.from_pretrained(model_id)
    model = AutoModelForImageTextToText.from_pretrained(
        model_id, 
        quantization_config=bnb_config,
        device_map="auto"
    )
    print("MedGemma 27B successfully loaded into VRAM.")

def handler(job):
    """Processes incoming jobs from the RunPod queue."""
    job_input = job["input"] # RunPod injects your payload into this 'input' key
    prompt_text = job_input.get("prompt", "")
    base64_string = job_input.get("image_base64")
    
    content_list = []
    
    if base64_string:
        # Decode the Base64 string back into a PIL Image
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        content_list.append({"type": "image", "image": image})
        
    content_list.append({"type": "text", "text": prompt_text})
    messages = [{"role": "user", "content": content_list}]
    
    # AutoProcessor automatically handles the strict 896x896 padding
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

# Start the Serverless listener
initialize_medgemma()
runpod.serverless.start({"handler": handler}) # Required to launch the worker