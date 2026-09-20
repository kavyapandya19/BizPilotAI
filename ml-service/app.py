from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="BizPilot AI ML Service",
    description="Machine Learning and Data Analytics API for BizPilot",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "success", "message": "ML Service is running"}

from api.prediction_routes import router as prediction_router
from api.analytics_routes import router as analytics_router

app.include_router(prediction_router, prefix="/api/v1/predict", tags=["Predictions"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
