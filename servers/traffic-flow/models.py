from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class TrafficFlowBase(SQLModel):
    entity_id: str = Field(index=True, unique=True)
    entity_type: str = Field(default="TrafficFlowObserved")
    name: str
    description: Optional[str] = None
    location_lon: float
    location_lat: float
    date_observed: datetime
    intensity: int = Field(description="Số lượng phương tiện")
    occupancy: float = Field(description="Tỷ lệ chiếm dụng (0-1)")
    average_vehicle_speed: float = Field(description="Tốc độ trung bình (km/h)")
    average_vehicle_length: float = Field(description="Chiều dài trung bình xe (m)")
    congested: bool = Field(default=False)
    lane_id: int = Field(default=1)
    ref_road_segment: Optional[str] = None


class TrafficFlow(TrafficFlowBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TrafficFlowCreate(TrafficFlowBase):
    pass


class TrafficFlowUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location_lon: Optional[float] = None
    location_lat: Optional[float] = None
    date_observed: Optional[datetime] = None
    intensity: Optional[int] = None
    occupancy: Optional[float] = None
    average_vehicle_speed: Optional[float] = None
    average_vehicle_length: Optional[float] = None
    congested: Optional[bool] = None
    lane_id: Optional[int] = None
    ref_road_segment: Optional[str] = None


class TrafficFlowRead(TrafficFlowBase):
    id: int
    created_at: datetime
    updated_at: datetime
