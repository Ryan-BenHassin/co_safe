from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
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
from sqlalchemy.orm import Session
from models import Camera as DBCamera, CameraLog, SessionLocal, get_db, init_db  # Change from relative to absolute import

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
                frame_data = {"frame_id": random.randint(1, 1000), "timestamp": datetime.now().isoformat()}
                
                # Create a new database session for each request
                db = SessionLocal()
                try:
                    if self.camera_type == 'cobot':
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
                        log = CameraLog(
                            camera_id=self.camera_id,
                            event="Human proximity check",
                            result=result["status"]
                        )
                        db.add(log)
                        db.commit()
                    
                    elif self.camera_type == 'machine':
                        response = requests.post(MACHINE_SERVICE_URL, json=frame_data)
                        result = response.json()
                        if result["status"] == "STOP":
                            alerts_history.insert(0, {
                                "type": "machine",
                                "message": f"Machine hazard detected (level: {result['hazard_level']:.2f})",
                                "timestamp": frame_data["timestamp"],
                                "severity": "error"
                            })
                            log = CameraLog(
                                camera_id=self.camera_id,
                                event="Machine hazard check",
                                result=result["status"]
                            )
                            db.add(log)
                            db.commit()
                    
                    elif self.camera_type == 'ppe':
                        response = requests.post(PPE_SERVICE_URL, json=frame_data)
                        result = response.json()
                        if result["status"] == "ALERT":
                            alerts_history.insert(0, {
                                "type": "ppe",
                                "message": f"Missing PPE: {', '.join(result['missing_ppe'])}",
                                "timestamp": frame_data["timestamp"],
                                "severity": "warning"
                            })
                            log = CameraLog(
                                camera_id=self.camera_id,
                                event="PPE compliance check",
                                result=result["status"]
                            )
                            db.add(log)
                            db.commit()
                finally:
                    db.close()
                
                await asyncio.sleep(5)  # Simulate frame every 5 seconds
            except Exception as e:
                logging.error(f"Simulation error for camera {self.camera_id}: {str(e)}")
                await asyncio.sleep(5)  # Wait before retrying on error

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/alerts")
async def get_alerts():
    """Get recent alerts from all services"""
    return {"alerts": alerts_history}

@app.post("/cameras")
async def add_camera(camera: Camera, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Add a new camera to the monitoring system"""
    try:
        # Check if camera already exists
        existing_camera = db.query(DBCamera).filter(DBCamera.id == camera.id).first()
        if existing_camera:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": f"Camera with ID {camera.id} already exists"}
            )

        db_camera = DBCamera(
            id=camera.id,
            name=camera.name,
            location=camera.location,
            type=camera.type,
            status=camera.status
        )
        db.add(db_camera)
        db.commit()
        db.refresh(db_camera)
        
        # Add to local camera dictionary for simulation
        cameras[camera.id] = camera
        camera_simulations[camera.id] = True
        
        async def start_simulation():
            sim = CameraSimulation(camera.id, camera.type)
            while camera_simulations[camera.id]:
                await sim.run()
        
        background_tasks.add_task(start_simulation)
        
        return JSONResponse(
            status_code=200,
            content={"status": "success", "data": camera.dict()}
        )
    except Exception as e:
        db.rollback()
        logging.error(f"Error adding camera: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/cameras")
async def list_cameras(db: Session = Depends(get_db)):
    """Get all registered cameras"""
    return db.query(DBCamera).all()

@app.get("/cameras/{camera_id}/logs")
async def get_camera_logs(camera_id: str, db: Session = Depends(get_db)):
    """Get logs for a specific camera"""
    camera = db.query(DBCamera).filter(DBCamera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return db.query(CameraLog).filter(CameraLog.camera_id == camera_id).all()

@app.post("/cameras/{camera_id}/simulate")
async def toggle_simulation(camera_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Toggle camera simulation"""
    camera = db.query(DBCamera).filter(DBCamera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Add to local dictionary if not present
    if camera_id not in cameras:
        cameras[camera_id] = Camera(
            id=camera.id,
            name=camera.name,
            location=camera.location,
            type=camera.type,
            status=camera.status
        )
    
    if camera_id in camera_simulations:
        camera_simulations[camera_id] = not camera_simulations[camera_id]
        return {"status": "success", "simulating": camera_simulations[camera_id]}
    
    camera_simulations[camera_id] = True
    
    async def start_simulation():
        sim = CameraSimulation(camera_id, camera.type)
        while camera_simulations[camera_id]:
            await sim.run()
    
    background_tasks.add_task(start_simulation)
    return {"status": "success", "simulating": True}

@app.get("/cameras/{camera_id}/simulation-status")
async def get_simulation_status(camera_id: str, db: Session = Depends(get_db)):
    """Get simulation status for a camera"""
    camera = db.query(DBCamera).filter(DBCamera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"simulating": camera_simulations.get(camera_id, False)}

@app.post("/process_stream")
async def process_stream(request: StreamRequest, db: Session = Depends(get_db)):
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
            for camera in db.query(DBCamera).filter(DBCamera.type == request.camera_type).all():
                log = CameraLog(
                    camera_id=camera.id,
                    event="Analysis",
                    result=result["status"]
                )
                db.add(log)
            db.commit()
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

@app.delete("/alerts")
async def clear_alerts():
    """Clear all alerts history"""
    alerts_history.clear()
    return {"status": "success", "message": "All alerts cleared"}

@app.delete("/cameras/{camera_id}/logs")
async def clear_camera_logs(camera_id: str, db: Session = Depends(get_db)):
    """Clear logs for a specific camera"""
    camera = db.query(DBCamera).filter(DBCamera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.query(CameraLog).filter(CameraLog.camera_id == camera_id).delete()
    db.commit()
    return {"status": "success", "message": f"Logs cleared for camera {camera_id}"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
