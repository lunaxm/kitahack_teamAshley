# this file defines the training pipeline for fine-tuning the MedGemma model using QLoRA. 
# It loads the base model in 4-bit quantized mode, attaches LoRA adapters, and trains on a custom medical dataset. 
# The training loop is configured to be efficient on 24GB GPUs, and saves only the adapter weights after training to minimize storage requirements. 
# Make sure to set your Hugging Face token in the HF_TOKEN environment variable before running this script.
import os
import torch
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForImageTextToText, 
    AutoProcessor, 
    BitsAndBytesConfig, 
    TrainingArguments
)
from trl import SFTTrainer

# 1. Configuration
MODEL_ID = "google/medgemma-1.5-27b-it"
DATASET_PATH = "../ml_data/dataset.jsonl"
OUTPUT_DIR = "../ml_data/saved_adapters"
HF_TOKEN = os.getenv("HF_TOKEN")

def run_qlora_training():
    print("Initializing QLoRA Training Pipeline...")

    # 2. Configure 4-bit Quantization (The "Q" in QLoRA)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True
    )

    # Load Base Model & Processor
    processor = AutoProcessor.from_pretrained(MODEL_ID, token=HF_TOKEN)
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID, 
        quantization_config=bnb_config,
        device_map="auto",
        token=HF_TOKEN
    )

    # Prepare model for 4-bit training (freezes base weights, enables gradient checkpointing)
    model = prepare_model_for_kbit_training(model)

    # 3. Configure LoRA Adapters (The "LoRA" in QLoRA)
    lora_config = LoraConfig(
        r=16,               # Rank: The "size" of the adapter matrix
        lora_alpha=32,      # Scaling factor
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"], # Target Gemma's attention mechanism
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    # Attach adapters to the frozen base model
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters() # This will show you are only training ~0.5% of the model!

    # 4. Load Custom Medical Dataset
    # Assumes a JSONL file where each line has a "text" key containing the formatted prompt
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    # 5. Define Training Parameters
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=1, # Keep at 1 to avoid Out-Of-Memory errors on 24GB GPUs
        gradient_accumulation_steps=4, # Simulates a batch size of 4
        optim="paged_adamw_32bit",
        save_steps=50,
        logging_steps=10,
        learning_rate=2e-4,
        max_grad_norm=0.3,
        max_steps=200,                 # Adjust based on your dataset size
        warmup_ratio=0.03,
        bf16=True,                     # Critical for training stability on newer GPUs
    )

    # 6. Initialize Trainer and Start
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=512,            # Truncate sequences to save VRAM
        tokenizer=processor.tokenizer,
    )

    print("Starting Training Loop...")
    trainer.train()

    # 7. Save Final Adapters
    print(f"Training complete. Saving adapters to {OUTPUT_DIR}")
    trainer.model.save_pretrained(OUTPUT_DIR)
    processor.save_pretrained(OUTPUT_DIR)

if __name__ == "__main__":
    run_qlora_training()