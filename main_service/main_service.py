from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import random
from datetime import datetime

app = FastAPI(
    title="Safety Monitoring System - Main Service",
    description="Coordinates video stream processing across safety monitoring services"
)

# Simulated service URLs
COBOT_SERVICE_URL = "http://cobot-service:5001/analyze"
MACHINE_SERVICE_URL = "http://machine-service:5002/analyze"
PPE_SERVICE_URL = "http://ppe-service:5003/analyze"

class StreamRequest(BaseModel):
    camera_type: str = "cobot"

@app.post("/process_stream")
async def process_stream(request: StreamRequest):
    """
    Process video stream from different camera types
    
    Returns:
        dict: Analysis results from the appropriate service
    """
    frame_data = {"frame_id": random.randint(1, 1000), "timestamp": datetime.now().isoformat()}
    
    try:
        if request.camera_type == 'cobot':
            response = requests.post(COBOT_SERVICE_URL, json=frame_data)
            return {"status": "success", "result": response.json()}
        elif request.camera_type == 'machine':
            response = requests.post(MACHINE_SERVICE_URL, json=frame_data)
            return {"status": "success", "result": response.json()}
        elif request.camera_type == 'ppe':
            response = requests.post(PPE_SERVICE_URL, json=frame_data)
            return {"status": "success", "result": response.json()}
        else:
            raise HTTPException(status_code=400, detail="Invalid camera type")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
