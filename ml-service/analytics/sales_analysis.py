import pandas as pd

def calculate_kpis(df: pd.DataFrame) -> dict:
    """
    Calculate basic KPIs from sales data.
    """
    if df.empty:
        return {
            "total_revenue": 0,
            "total_orders": 0,
            "average_order_value": 0
        }
        
    total_revenue = df['totalAmount'].sum() if 'totalAmount' in df.columns else 0
    total_orders = len(df)
    aov = total_revenue / total_orders if total_orders > 0 else 0
    
    return {
        "total_revenue": float(total_revenue),
        "total_orders": int(total_orders),
        "average_order_value": float(aov)
    }

def get_revenue_over_time(df: pd.DataFrame, freq='D') -> dict:
    """
    Aggregate revenue over time (daily, weekly, monthly).
    freq: 'D' for daily, 'W' for weekly, 'M' for monthly
    """
    if df.empty or 'date' not in df.columns or 'totalAmount' not in df.columns:
        return {"dates": [], "revenue": []}
        
    # Group by date frequency
    aggregated = df.groupby(pd.Grouper(key='date', freq=freq))['totalAmount'].sum().reset_index()
    
    # Convert dates to string for JSON serialization
    dates = aggregated['date'].dt.strftime('%Y-%m-%d').tolist()
    revenue = aggregated['totalAmount'].tolist()
    
    return {
        "dates": dates,
        "revenue": revenue
    }
