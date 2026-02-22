This README outlines a robust **Scheduled Reinforcement Learning Loop**. By decoupling the live application from the training environment, you maintain high performance while ensuring the model evolves based on real-world expert feedback stored in your database.

---

# MedGemma-RL: Periodic Feedback & Alignment Pipeline

This repository contains the infrastructure for a "Human-in-the-loop" medical AI. It captures expert preferences through a production application, stores them in a relational database, and periodically executes a **Direct Preference Optimization (DPO)** training job to update the model.

## 🏗️ System Architecture

The pipeline is organized into three distinct layers:

1. **The Application Layer (React/FastAPI):** Serves the model via Vertex AI and provides an interface for clinicians to "Approve" or "Correct" model outputs.
2. **The Persistence Layer (PostgreSQL):** A database that acts as a buffer, accumulating preference pairs (`prompt`, `chosen`, `rejected`) until a training threshold is met.
3. **The Alignment Layer (Hugging Face + Vertex AI):** A scheduled worker that pulls data from the database, fine-tunes the model using DPO, and performs a "Blue-Green" deployment to update the production endpoint.

---

## 🛠️ Workflow Implementation

### 1. Feedback Collection

When an expert interacts with the application, the system logs the interaction:

* **Prompt:** The input (e.g., a patient case or an image description).
* **Rejected:** The initial model response that was deemed sub-optimal.
* **Chosen:** The edited or selected "correct" response provided by the expert.
* **Metadata:** Timestamps and version IDs to track which model generated the original response.

### 2. Scheduled Training (The "Batch" Update)

Instead of continuous training, the system follows a **Periodic Trigger** strategy:

* **Trigger:** A Cron job or a Cloud Function checks the database every weekend.
* **Threshold:** Training only commences if a significant number of new preference pairs (e.g., >500) have been collected.
* **Process:** The worker pulls the `pending` data, converts it into a Hugging Face Dataset, and runs the DPO alignment script.

### 3. Deployment & Model Swap

To ensure zero downtime:

* The new model is uploaded as a **new version** in the Vertex AI Model Registry.
* A validation suite runs against the new version to ensure no regression in medical accuracy.
* **Traffic Splitting:** Vertex AI routes 10% of traffic to the new model. If error rates remain low, it scales to 100%.

---

## 📂 Project Structure

```text
├── app/                  # Application Frontend & Backend
│   ├── api/              # Feedback endpoints
│   └── ui/               # Clinician feedback interface
├── db/                   # Database schemas & migrations
│   └── schema.sql        # Definition of the 'preferences' table
├── training/             # Pathway B: Local/HF Training logic
│   ├── dpo_worker.py     # Main trainer script
│   └── data_loader.py    # Logic to fetch 'pending' rows from DB
├── deployment/           # Pathway A: Vertex AI management
│   └── model_swap.py     # Logic for traffic splitting & versioning
└── README.md

```

---

## 📈 Verifiable Rewards for R&D

For your engineering and digital twin applications, consider these specialized "Reward" strategies during the periodic update:

* **Factual Consistency:** Penalize the model if it contradicts the structured data in your agricultural or air quality databases.
* **Reasoning Quality:** Use RL to reward the model for including "Chain of Thought" explanations that match your R&D documentation.
* **Safety Constraints:** Maintain a "Never-Reject" set of safety guidelines that the model must follow regardless of user feedback.

---

## ⚠️ Security & Compliance

* **Data Anonymization:** Ensure all data pulled from the database for training is stripped of PII/PHI.
* **Model Lineage:** Always log the `Base_Model_ID` and the `Training_Dataset_Hash` for every deployment to maintain a clear audit trail.

**Would you like me to draft the SQL schema for your preference database or the logic for the Vertex AI traffic-splitting script?**