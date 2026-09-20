import pandas as pd
import numpy as np

def predict_future_sales_simple(df: pd.DataFrame, days_ahead: int = 30) -> dict:
    """
    A simple baseline forecasting model using moving averages.
    In a real scenario, this would load a trained model (e.g., Prophet, ARIMA, or XGBoost).
    """
    if df.empty or 'date' not in df.columns or 'totalAmount' not in df.columns:
        return {"dates": [], "predictions": []}
        
    # Aggregate daily
    daily_sales = df.groupby(pd.Grouper(key='date', freq='D'))['totalAmount'].sum().reset_index()
    
    if len(daily_sales) < 7:
        # Not enough data for meaningful prediction, just return flat average
        avg = daily_sales['totalAmount'].mean() if not daily_sales.empty else 0
        last_date = daily_sales['date'].max() if not daily_sales.empty else pd.Timestamp.now()
    else:
        # Use 7-day moving average of the last 7 days as the baseline trend
        avg = daily_sales['totalAmount'].tail(7).mean()
        last_date = daily_sales['date'].max()

    # Generate future dates
    future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, days_ahead + 1)]
    
    # Add some random noise to make it look realistic (for demonstration)
    noise = np.random.normal(0, avg * 0.1, days_ahead)
    predictions = [max(0, avg + n) for n in noise] # ensure no negative sales
    
    return {
        "dates": [d.strftime('%Y-%m-%d') for d in future_dates],
        "predictions": predictions
    }
