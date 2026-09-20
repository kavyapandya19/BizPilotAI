from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from data.loader import load_sales_data
from models.sales_forecaster import predict_future_sales_simple
from utils.helpers import format_response, handle_error

router = APIRouter()

class SalesDataPayload(BaseModel):
    data: List[Dict[str, Any]]
    days_ahead: int = 30

@router.post("/sales")
async def predict_sales(payload: SalesDataPayload):
    try:
        df = load_sales_data(payload.data)
        predictions = predict_future_sales_simple(df, payload.days_ahead)
        return format_response(data=predictions, message="Sales predictions generated successfully")
    except Exception as e:
        return handle_error(e)
