def format_response(data=None, message="Success", success=True):
    """
    Standardize the API response format.
    """
    return {
        "success": success,
        "message": message,
        "data": data
    }

def handle_error(e: Exception):
    """
    Standardize error responses.
    """
    return {
        "success": False,
        "message": str(e),
        "data": None
    }
