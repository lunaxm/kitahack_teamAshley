from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class Patient(BaseModel):
  id: str
  name: str


class PatientCreateRequest(BaseModel):
    name: str = Field(..., example="John Doe")
    age: int = Field(..., gt=0, example=30)
    ic: str = Field(..., example="900101-14-5555")
    gender: str = Field(..., example="Male")
    dob: str = Field(..., example="13-05-2004")

class GatewayRequest(BaseModel):
    event: str  
    patient_id: Optional[str] = None
    record_id: Optional[str] = None
    data: Dict[str, Any] = {}