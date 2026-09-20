from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from data.loader import load_sales_data
from analytics.sales_analysis import calculate_kpis, get_revenue_over_time
from utils.helpers import format_response, handle_error

router = APIRouter()

class SalesDataPayload(BaseModel):
    data: List[Dict[str, Any]]

@router.post("/kpis")
async def get_kpis(payload: SalesDataPayload):
    try:
        df = load_sales_data(payload.data)
        kpis = calculate_kpis(df)
        return format_response(data=kpis, message="KPIs calculated successfully")
    except Exception as e:
        return handle_error(e)

@router.post("/revenue-trend")
async def get_revenue_trend(payload: SalesDataPayload):
    try:
        df = load_sales_data(payload.data)
        trend = get_revenue_over_time(df, freq='D')
        return format_response(data=trend, message="Revenue trend calculated successfully")
    except Exception as e:
        return handle_error(e)
