from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI(
    title="Machine Safety Service",
    description="Analyzes video streams for machine safety hazards"
)

class FrameData(BaseModel):
    frame_id: int
    timestamp: str

@app.post("/analyze")
async def analyze(frame: FrameData):
    """
    Analyze a video frame for machine safety
    
    Returns:
        dict: Analysis results with hazard status
    """
    decision = random.choice(['OK', 'STOP'])
    return {
        "status": decision,
        "hazard_level": random.uniform(0, 1.0),
        "frame_id": frame.frame_id
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
