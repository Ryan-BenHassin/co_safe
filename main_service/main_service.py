from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
import random
from datetime import datetime
import logging
import asyncio
import threading
from typing import Dict

app = FastAPI(
    title="Safety Monitoring System - Main Service",
    description="Coordinates video stream processing across safety monitoring services"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated service URLs
COBOT_SERVICE_URL = "http://cobot-service:5002/analyze"
MACHINE_SERVICE_URL = "http://machine-service:5002/analyze"
PPE_SERVICE_URL = "http://ppe-service:5003/analyze"

# Store last 100 alerts
alerts_history = []
MAX_ALERTS = 100

# Add new storage for cameras and logs
cameras = {}
camera_logs = {}

# Add simulation state
camera_simulations: Dict[str, bool] = {}

class StreamRequest(BaseModel):
    camera_type: str = "cobot"

class Camera(BaseModel):
    id: str
    name: str
    location: str
    type: str  # 'cobot', 'machine', or 'ppe'
    status: str = "active"

class CameraSimulation:
    def __init__(self, camera_id: str, camera_type: str):
        self.camera_id = camera_id
        self.camera_type = camera_type
        self.running = True

    async def run(self):
        while self.running:
            try:
                await process_stream(StreamRequest(camera_type=self.camera_type))
                await asyncio.sleep(5)  # Simulate frame every 5 seconds
            except Exception as e:
                logging.error(f"Simulation error for camera {self.camera_id}: {str(e)}")

@app.get("/alerts")
async def get_alerts():
    """Get recent alerts from all services"""
    return {"alerts": alerts_history}

@app.post("/cameras")
async def add_camera(camera: Camera):
    """Add a new camera to the monitoring system"""
    try:
        cameras[camera.id] = camera
        camera_logs[camera.id] = []
        return JSONResponse(
            status_code=200,
            content={"status": "success", "data": camera.dict()}
        )
    except Exception as e:
        logging.error(f"Error adding camera: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/cameras")
async def list_cameras():
    """Get all registered cameras"""
    return list(cameras.values())

@app.get("/cameras/{camera_id}/logs")
async def get_camera_logs(camera_id: str):
    """Get logs for a specific camera"""
    if camera_id not in camera_logs:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera_logs[camera_id]

@app.post("/cameras/{camera_id}/simulate")
async def toggle_simulation(camera_id: str, background_tasks: BackgroundTasks):
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if camera_id in camera_simulations:
        camera_simulations[camera_id] = not camera_simulations[camera_id]
        return {"status": "success", "simulating": camera_simulations[camera_id]}
    
    camera = cameras[camera_id]
    camera_simulations[camera_id] = True
    
    async def start_simulation():
        sim = CameraSimulation(camera_id, camera.type)
        while camera_simulations[camera_id]:
            await sim.run()
    
    background_tasks.add_task(start_simulation)
    return {"status": "success", "simulating": True}

@app.get("/cameras/{camera_id}/simulation-status")
async def get_simulation_status(camera_id: str):
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"simulating": camera_simulations.get(camera_id, False)}

@app.post("/process_stream")
async def process_stream(request: StreamRequest):
    """
    Process video stream from different camera types
    
    Returns:
        dict: Analysis results from the appropriate service
    """
    frame_data = {"frame_id": random.randint(1, 1000), "timestamp": datetime.now().isoformat()}
    
    try:
        result = None
        if request.camera_type == 'cobot':
            response = requests.post(COBOT_SERVICE_URL, json=frame_data)
            result = response.json()
            if result["status"] == "SLOW_DOWN":
                alerts_history.insert(0, {
                    "type": "cobot",
                    "message": "Human detected near cobot",
                    "timestamp": frame_data["timestamp"],
                    "severity": "warning"
                })
            # Add to camera logs
            for camera_id, camera in cameras.items():
                if camera.type == 'cobot':
                    camera_logs[camera_id].append({
                        "timestamp": frame_data["timestamp"],
                        "event": "Human proximity check",
                        "result": result["status"]
                    })
        elif request.camera_type == 'machine':
            response = requests.post(MACHINE_SERVICE_URL, json=frame_data)
            result = response.json()
            if result["status"] == "STOP":
                alerts_history.insert(0, {
                    "type": "machine",
                    "message": f"Machine hazard detected (level: {result['hazard_level']:.2f})",
                    "timestamp": frame_data["timestamp"],
                    "severity": "error"
                })
        elif request.camera_type == 'ppe':
            response = requests.post(PPE_SERVICE_URL, json=frame_data)
            result = response.json()
            if result["status"] == "ALERT":
                alerts_history.insert(0, {
                    "type": "ppe",
                    "message": f"Missing PPE: {', '.join(result['missing_ppe'])}",
                    "timestamp": frame_data["timestamp"],
                    "severity": "warning"
                })
        else:
            raise HTTPException(status_code=400, detail="Invalid camera type")
            
        # Trim alerts history
        if len(alerts_history) > MAX_ALERTS:
            alerts_history.pop()
            
        return {"status": "success", "result": result}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
