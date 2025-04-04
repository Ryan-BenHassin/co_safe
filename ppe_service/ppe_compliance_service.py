from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI(
    title="PPE Compliance Service",
    description="Analyzes video streams for PPE compliance"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameData(BaseModel):
    frame_id: int
    timestamp: str

@app.post("/analyze")
async def analyze(frame: FrameData):
    """
    Analyze a video frame for PPE compliance
    
    Returns:
        dict: Analysis results with compliance status
    """
    decision = random.choice(['OK', 'ALERT'])
    missing_items = ['helmet', 'vest', 'goggles'] if decision == 'ALERT' else []
    return {
        "status": decision,
        "missing_ppe": missing_items,
        "frame_id": frame.frame_id
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003)
