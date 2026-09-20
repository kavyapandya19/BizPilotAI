import pandas as pd
from typing import List, Dict

def load_sales_data(data: List[Dict]) -> pd.DataFrame:
    """
    Load JSON sales data into a Pandas DataFrame and preprocess it.
    """
    if not data:
        return pd.DataFrame()
        
    df = pd.DataFrame(data)
    
    # Ensure date is datetime
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        
    return df

def load_inventory_data(data: List[Dict]) -> pd.DataFrame:
    """
    Load JSON inventory data into a Pandas DataFrame.
    """
    if not data:
        return pd.DataFrame()
        
    return pd.DataFrame(data)
