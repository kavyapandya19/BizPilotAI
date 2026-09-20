import os
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BizPilot AI ML Service"
    API_V1_STR: str = "/api/v1"
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:5000")
    
    # Model settings
    SALES_MODEL_PATH: str = "saved_models/sales_model.pkl"
    DEMAND_MODEL_PATH: str = "saved_models/demand_model.pkl"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
