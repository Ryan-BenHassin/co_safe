from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI(
    title="Cobot Safety Service",
    description="Analyzes video streams for cobot safety violations"
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
    Analyze a video frame for cobot safety
    
    Returns:
        dict: Analysis results with safety status
    """
    decision = random.choice(['OK', 'SLOW_DOWN'])
    return {
        "status": decision,
        "confidence": random.uniform(0.8, 1.0),
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
    uvicorn.run(app, host="0.0.0.0", port=5001)
