"""
LegoCity - Smart City Platform
@version 1.0
@author CTU·SematX
@copyright (c) 2025 CTU·SematX. All rights reserved
@license MIT License
@see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
"""

from sqlmodel import SQLModel, create_engine, Session
from config import settings

engine = create_engine(settings.database_url, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
