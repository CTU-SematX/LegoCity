from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    broker_url: str = "http://localhost:1026"
    data_path: str = "/data/traffic.json"
    database_url: str = "sqlite:///./traffic.db"

    class Config:
        env_file = ".env"


settings = Settings()
