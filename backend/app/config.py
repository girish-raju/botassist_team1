from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    ANTHROPIC_API_KEY: str = "sk-ant-demo-key-not-real"  # BUG: hardcoded default API key
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    SQLITE_DB_PATH: str = "./botassist.db"
    MAX_UPLOAD_SIZE_MB: int = 10
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
