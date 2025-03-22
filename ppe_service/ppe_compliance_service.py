from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI(
    title="PPE Compliance Service",
    description="Analyzes video streams for PPE compliance"
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

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003)
