"""
LegoCity - Smart City Platform
@version 1.0
@author CTU·SematX
@copyright (c) 2025 CTU·SematX. All rights reserved
@license MIT License
@see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
"""

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

import httpx
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlmodel import Session, select

from config import settings
from database import init_db, get_session, engine
from models import TrafficFlow, TrafficFlowCreate, TrafficFlowUpdate, TrafficFlowRead
from ngsi import to_ngsi_ld, from_seed_data


def seed_data():
    """Load seed data from JSON file into database."""
    if not os.path.exists(settings.data_path):
        print(f"Seed data file not found: {settings.data_path}")
        return
    
    with Session(engine) as session:
        # Check if data already exists
        existing = session.exec(select(TrafficFlow)).first()
        if existing:
            print("Database already seeded, skipping...")
            return
        
        with open(settings.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        for item in data:
            record_data = from_seed_data(item)
            record = TrafficFlow(**record_data)
            session.add(record)
        
        session.commit()
        print(f"Seeded {len(data)} traffic flow records")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    seed_data()
    yield
    # Shutdown


app = FastAPI(
    title="Traffic Flow Server",
    description="API quản lý dữ liệu lưu lượng giao thông (NGSI-LD TrafficFlowObserved)",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "traffic-flow", "timestamp": datetime.utcnow().isoformat()}


@app.get("/traffic-flows", response_model=List[TrafficFlowRead], tags=["Traffic Flow"])
def list_traffic_flows(
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Lấy danh sách tất cả TrafficFlowObserved."""
    statement = select(TrafficFlow).offset(skip).limit(limit)
    results = session.exec(statement).all()
    return results


@app.get("/traffic-flows/{record_id}", response_model=TrafficFlowRead, tags=["Traffic Flow"])
def get_traffic_flow(record_id: int, session: Session = Depends(get_session)):
    """Lấy chi tiết một TrafficFlowObserved theo ID."""
    record = session.get(TrafficFlow, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@app.post("/traffic-flows", response_model=TrafficFlowRead, tags=["Traffic Flow"])
def create_traffic_flow(data: TrafficFlowCreate, session: Session = Depends(get_session)):
    """Tạo mới một TrafficFlowObserved."""
    record = TrafficFlow.model_validate(data)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@app.put("/traffic-flows/{record_id}", response_model=TrafficFlowRead, tags=["Traffic Flow"])
def update_traffic_flow(
    record_id: int,
    data: TrafficFlowUpdate,
    session: Session = Depends(get_session)
):
    """Cập nhật một TrafficFlowObserved."""
    record = session.get(TrafficFlow, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
    
    record.updated_at = datetime.utcnow()
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@app.delete("/traffic-flows/{record_id}", tags=["Traffic Flow"])
def delete_traffic_flow(record_id: int, session: Session = Depends(get_session)):
    """Xóa một TrafficFlowObserved."""
    record = session.get(TrafficFlow, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    session.delete(record)
    session.commit()
    return {"message": "Record deleted successfully"}


@app.post("/traffic-flows/{record_id}/push", tags=["Broker"])
async def push_to_broker(record_id: int, session: Session = Depends(get_session)):
    """Đẩy một TrafficFlowObserved lên Context Broker."""
    record = session.get(TrafficFlow, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    ngsi_data = to_ngsi_ld(record)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.broker_url}/ngsi-ld/v1/entities",
                json=ngsi_data,
                headers={"Content-Type": "application/ld+json"}
            )
            
            if response.status_code == 409:
                # Entity already exists, try to update
                entity_id = ngsi_data["id"]
                response = await client.patch(
                    f"{settings.broker_url}/ngsi-ld/v1/entities/{entity_id}/attrs",
                    json={k: v for k, v in ngsi_data.items() if k not in ["id", "type", "@context"]},
                    headers={
                        "Content-Type": "application/ld+json",
                        "Link": f'<{ngsi_data["@context"][0]}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
                    }
                )
            
            response.raise_for_status()
            return {"message": "Pushed successfully", "entity_id": ngsi_data["id"]}
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to push to broker: {str(e)}")


@app.post("/traffic-flows/push-all", tags=["Broker"])
async def push_all_to_broker(session: Session = Depends(get_session)):
    """Đẩy tất cả TrafficFlowObserved lên Context Broker."""
    records = session.exec(select(TrafficFlow)).all()
    
    results = {"success": 0, "failed": 0, "errors": []}
    
    async with httpx.AsyncClient() as client:
        for record in records:
            ngsi_data = to_ngsi_ld(record)
            try:
                response = await client.post(
                    f"{settings.broker_url}/ngsi-ld/v1/entities",
                    json=ngsi_data,
                    headers={"Content-Type": "application/ld+json"}
                )
                
                if response.status_code == 409:
                    entity_id = ngsi_data["id"]
                    response = await client.patch(
                        f"{settings.broker_url}/ngsi-ld/v1/entities/{entity_id}/attrs",
                        json={k: v for k, v in ngsi_data.items() if k not in ["id", "type", "@context"]},
                        headers={
                            "Content-Type": "application/ld+json",
                            "Link": f'<{ngsi_data["@context"][0]}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
                        }
                    )
                
                response.raise_for_status()
                results["success"] += 1
            except httpx.HTTPError as e:
                results["failed"] += 1
                results["errors"].append({"entity_id": ngsi_data["id"], "error": str(e)})
    
    return results


@app.get("/traffic-flows/{record_id}/ngsi-ld", tags=["NGSI-LD"])
def get_as_ngsi_ld(record_id: int, session: Session = Depends(get_session)):
    """Lấy TrafficFlowObserved dưới dạng NGSI-LD JSON."""
    record = session.get(TrafficFlow, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return to_ngsi_ld(record)
