"""
LegoCity - Smart City Platform
@version 1.0
@author CTU·SematX
@copyright (c) 2025 CTU·SematX. All rights reserved
@license MIT License
@see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    broker_url: str = "http://localhost:1026"
    data_path: str = "/data/traffic.json"
    database_url: str = "sqlite:///./traffic.db"

    class Config:
        env_file = ".env"


settings = Settings()
