from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "不動産業務管理システム"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/real_estate"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = {"env_file": ".env"}


settings = Settings()
