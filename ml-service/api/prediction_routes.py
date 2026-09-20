from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from data.loader import load_sales_data
from models.sales_forecaster import predict_future_sales_simple
from models.churn_predictor import churn_predictor
from utils.helpers import format_response, handle_error

router = APIRouter()

class SalesDataPayload(BaseModel):
    data: List[Dict[str, Any]]
    days_ahead: int = 30

class CustomerChurnPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = "Customer"
    email: Optional[str] = None
    orders: Optional[float] = Field(default=1, alias="order_count")
    ltv: Optional[float] = 0.0
    avg_order_value: Optional[float] = None
    recency_days: Optional[float] = 30.0
    segment: Optional[str] = "Standard"

    class Config:
        populate_by_name = True

class BatchChurnPayload(BaseModel):
    customers: List[Dict[str, Any]]

@router.post("/sales")
async def predict_sales(payload: SalesDataPayload):
    try:
        df = load_sales_data(payload.data)
        predictions = predict_future_sales_simple(df, payload.days_ahead)
        return format_response(data=predictions, message="Sales predictions generated successfully")
    except Exception as e:
        return handle_error(e)

@router.post("/churn")
async def predict_single_churn(payload: CustomerChurnPayload):
    """
    Predict churn risk percentage, risk category, and key drivers using RandomForest.
    """
    try:
        data_dict = payload.model_dump(by_alias=True)
        result = churn_predictor.predict_single(data_dict)
        return format_response(data=result, message="RandomForest churn prediction completed")
    except Exception as e:
        return handle_error(e)

@router.post("/churn/batch")
async def predict_batch_churn(payload: BatchChurnPayload):
    """
    Batch score customer list for churn risk using RandomForest.
    """
    try:
        results = churn_predictor.predict_batch(payload.customers)
        return format_response(data=results, message=f"RandomForest scored {len(results)} customers")
    except Exception as e:
        return handle_error(e)

@router.get("/churn/model-info")
async def get_churn_model_info():
    """
    Get RandomForest model metadata, hyperparameters, and feature importance rankings.
    """
    try:
        info = churn_predictor.get_info()
        return format_response(data=info, message="Churn model information retrieved")
    except Exception as e:
        return handle_error(e)
