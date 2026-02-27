<<<<<<< Updated upstream
# app/services/prompt_builder.
import re
=======
# app/services/prompt_builder.py
>>>>>>> Stashed changes

# Dictionary of specialized medical roles
MEDICAL_ROLES = {
    "general": "general practitioner",
    "radiology": "radiologist",
    "cardiology": "cardiologist",
    "neurology": "neurologist",
    "oncology": "oncologist",
    "endocrinology": "endocrinologist",
    "pulmonology": "pulmonologist",
    "pathology": "pathologist",
    "dermatology": "dermatologist",
    "pediatrics": "pediatrician"
}

def _format_clinical_context(current_details: dict, historical_records: list) -> str:
    """Internal helper to format database records into readable text for the LLM."""
    context = "### Context: Patient Clinical Data\n"
    
    # 1. Current Details (Vitals, Lab Results, Scan Metadata)
    context += "**Current Admission / Details:**\n"
    if current_details:
        for key, value in current_details.items():
            formatted_key = str(key).replace("_", " ").title()
            context += f"- {formatted_key}: {value}\n"
    else:
        context += "- No current vitals or lab results provided.\n"

    # 2. Historical Records (Past visits from the ClinicalRecords collection)
    context += "\n**Historical Health Records:**\n"
    if historical_records and len(historical_records) > 0:
        for record in historical_records:
            date = record.get("visit_date", "Unknown Date")
            status = record.get("clinical_record", {}).get("diagnosis", {}).get("status", "Unknown")
            context += f"- Date: {date} | Status: {status}\n"
    else:
        context += "- No prior historical records found for this patient.\n"
        
    return context


def build_prognosis_prompt(role_key: str, current_details: dict, historical_records: list, has_image: bool = False) -> str:
    """
    Builds the Stage 1 Prompt: Analyzing data and scans to provide top 10 prognoses.
    """
    # 1. Role
    role_title = MEDICAL_ROLES.get(role_key.lower(), "medical professional")
    role_str = f"You are an expert AI {role_title}."
    
    # 2. Task (Objective Clarification)
    objective_str = "Task: Analyze the provided patient history, lab results, and medical imaging (if provided) to generate a prioritized differential diagnosis."
    
    # 3. Context
    context_str = _format_clinical_context(current_details, historical_records)
    if has_image:
        context_str += "\n**Medical Imaging:**\n- [An image/scan has been provided in the input payload for your visual analysis.]\n"

<<<<<<< Updated upstream
    # 4. Detailed Task (Flush left to avoid leading spaces)
    detailed_task = """### Analysis Task:
Provide the top 10 potential prognoses based on the clinical context and visual inferences from the scan.
Constraint 1: You MUST rank them in descending order, starting with the highest probability at number 1.
Constraint 2: Do not include any conversational filler, introductory text, greetings, or concluding remarks. Output ONLY the ranked list."""

    # 5. Output Format (Flush left)
    output_format = """### Strict Output Format:
You must format every single item exactly like this template:

1. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

2. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

3. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

4. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

5. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

6. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

7. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

8. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

9. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]

10. Prognosis: [Name of Prognosis]
Probability: [XX]%
Details: [Your detailed clinical inference and justification]"""

    # Assemble the final prompt
    final_prompt = f"""{role_str}

{objective_str}

{context_str}

=======
    # 4. Detailed Task
    detailed_task = """### Analysis Task:
Provide the top 10 potential prognoses based on the clinical context and visual inferences from the scan. For each prognosis, you must provide a probability score and a clinical justification detailing your reasoning."""

    # 5. Output Format
    output_format = """### Output Format:
Please format your response strictly as follows:
1. **[Prognosis Name]** (Probability: [XX]%)
   - **Justification:** [Your detailed clinical inference based on the scans and blood test results]
2. **[Prognosis Name]** (Probability: [XX]%)
   - **Justification:** [...]
...(continue for top 10)"""

    # Assemble the final prompt
    final_prompt = f"""{role_str}
{objective_str}

{context_str}
>>>>>>> Stashed changes
{detailed_task}

{output_format}"""

    return final_prompt.strip()


def build_treatment_prompt(role_key: str, confirmed_diagnosis: str, current_details: dict, historical_records: list) -> str:
    """
    Builds the Stage 2 Prompt: Recommending treatment and medication after a doctor confirms the diagnosis.
    """
    # 1. Role
    role_title = MEDICAL_ROLES.get(role_key.lower(), "medical professional")
    role_str = f"You are an expert AI {role_title}."
    
    # 2. Task
    objective_str = f"Task: The attending physician has officially confirmed the diagnosis of **{confirmed_diagnosis}**. Your objective is to formulate a comprehensive, patient-specific treatment and medication plan."
    
    # 3. Context
    context_str = _format_clinical_context(current_details, historical_records)

    # 4. Output Format
    output_format = """### Output Format:
Please format your response strictly as follows:

### Treatment Plan
- [Intervention/Therapy 1]: [Detailed description]
- [Intervention/Therapy 2]: [Detailed description]
- [Lifestyle/Dietary Recommendations]

### Medication Plan
- **[Medication Name]**: [Dosage] | [Frequency] | [Duration]
  - *Rationale:* [Why this is appropriate given the patient's specific lab results and history]
- **[Medication Name]**: ..."""

    final_prompt = f"""{role_str}
{objective_str}

{context_str}
{output_format}"""

<<<<<<< Updated upstream
    return final_prompt.strip()

def parse_prognosis_text_to_json(raw_text: str) -> list:
    """Converts the strict MedGemma text output into a list of Python dictionaries."""
    parsed_data = []
    
    # Split the giant string into individual blocks every time it sees "1. Prognosis:", "2. Prognosis:", etc.
    blocks = re.split(r'\n(?=\d+\.\s*Prognosis:)', raw_text.strip())
    
    for block in blocks:
        # Extract the specific lines using regex
        prognosis_match = re.search(r'Prognosis:\s*(.*)', block)
        probability_match = re.search(r'Probability:\s*(.*)', block)
        details_match = re.search(r'Details:\s*(.*)', block, re.DOTALL) # DOTALL captures multi-line details
        
        # If all three pieces were successfully found, add them to the array
        if prognosis_match and probability_match and details_match:
            parsed_data.append({
                "prognosis": prognosis_match.group(1).strip(),
                "probability": probability_match.group(1).strip(),
                "details": details_match.group(1).strip()
            })
            
    return parsed_data
=======
    return final_prompt.strip()
>>>>>>> Stashed changes
