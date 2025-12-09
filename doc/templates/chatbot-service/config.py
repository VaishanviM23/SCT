"""Configuration management for SCT Chatbot Microservice.

This module handles loading and validating configuration from
environment variables using Pydantic settings.
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # ========================================================================
    # Application Configuration
    # ========================================================================
    APP_NAME: str = Field(default="sct-chatbot-service", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    APP_DESCRIPTION: str = Field(
        default="SCT Chatbot Microservice - AI-Powered Security Assistant",
        description="Application description"
    )
    ENVIRONMENT: str = Field(default="development", description="Environment name")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # ========================================================================
    # Server Configuration
    # ========================================================================
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    WORKERS: int = Field(default=4, description="Number of worker processes")
    RELOAD: bool = Field(default=False, description="Enable auto-reload")
    
    # ========================================================================
    # API Configuration
    # ========================================================================
    API_V1_PREFIX: str = Field(default="/api/v1", description="API version 1 prefix")
    
    # ========================================================================
    # CORS Configuration
    # ========================================================================
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:4200"],
        description="Allowed CORS origins"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="Allow credentials")
    CORS_ALLOW_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        description="Allowed HTTP methods"
    )
    CORS_ALLOW_HEADERS: List[str] = Field(default=["*"], description="Allowed headers")
    
    # ========================================================================
    # Azure AD Configuration
    # ========================================================================
    AZURE_TENANT_ID: str = Field(..., description="Azure AD tenant ID")
    AZURE_CLIENT_ID: str = Field(..., description="Azure AD client ID")
    AZURE_CLIENT_SECRET: str = Field(..., description="Azure AD client secret")
    
    # ========================================================================
    # Azure OpenAI Configuration
    # ========================================================================
    AZURE_OPENAI_ENDPOINT: str = Field(..., description="Azure OpenAI endpoint")
    AZURE_OPENAI_API_KEY: str = Field(..., description="Azure OpenAI API key")
    AZURE_OPENAI_DEPLOYMENT: str = Field(default="gpt-4o", description="Model deployment name")
    AZURE_OPENAI_API_VERSION: str = Field(
        default="2024-02-15-preview",
        description="Azure OpenAI API version"
    )
    AZURE_OPENAI_TEMPERATURE: float = Field(default=0.7, description="Model temperature")
    AZURE_OPENAI_MAX_TOKENS: int = Field(default=2000, description="Max tokens")
    
    # ========================================================================
    # Microsoft Sentinel Configuration
    # ========================================================================
    AZURE_WORKSPACE_ID: str = Field(..., description="Log Analytics workspace ID")
    AZURE_LOG_ANALYTICS_ENDPOINT: str = Field(
        default="https://api.loganalytics.io/v1",
        description="Log Analytics endpoint"
    )
    
    # ========================================================================
    # Redis Configuration
    # ========================================================================
    REDIS_HOST: str = Field(..., description="Redis host")
    REDIS_PORT: int = Field(default=6380, description="Redis port")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis password")
    REDIS_SSL: bool = Field(default=True, description="Use SSL for Redis")
    REDIS_DB: int = Field(default=0, description="Redis database number")
    REDIS_MAX_CONNECTIONS: int = Field(default=50, description="Max Redis connections")
    
    # ========================================================================
    # Security Configuration
    # ========================================================================
    JWT_ALGORITHM: str = Field(default="RS256", description="JWT algorithm")
    JWT_AUDIENCE: str = Field(
        default="api://chatbot-service",
        description="JWT audience"
    )
    JWT_ISSUER: str = Field(..., description="JWT issuer")
    JWT_LEEWAY: int = Field(default=10, description="JWT validation leeway in seconds")
    
    # ========================================================================
    # Rate Limiting
    # ========================================================================
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable rate limiting")
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Requests per minute")
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, description="Requests per hour")
    
    # ========================================================================
    # Conversation Configuration
    # ========================================================================
    CONVERSATION_TIMEOUT_MINUTES: int = Field(
        default=60,
        description="Conversation timeout in minutes"
    )
    MAX_CONVERSATION_HISTORY: int = Field(
        default=100,
        description="Max messages in conversation history"
    )
    MAX_MESSAGE_LENGTH: int = Field(
        default=2000,
        description="Max message length in characters"
    )
    CONTEXT_WINDOW_SIZE: int = Field(
        default=10,
        description="Context window size for AI processing"
    )
    
    # ========================================================================
    # Logging Configuration
    # ========================================================================
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format (json or text)")
    
    # ========================================================================
    # Monitoring Configuration
    # ========================================================================
    APPLICATIONINSIGHTS_CONNECTION_STRING: Optional[str] = Field(
        default=None,
        description="Application Insights connection string"
    )
    METRICS_ENABLED: bool = Field(default=True, description="Enable metrics")
    ENABLE_TRACING: bool = Field(default=True, description="Enable distributed tracing")
    
    # ========================================================================
    # Feature Flags
    # ========================================================================
    FEATURE_WEBSOCKET_ENABLED: bool = Field(
        default=True,
        description="Enable WebSocket support"
    )
    
    # ========================================================================
    # Testing Configuration
    # ========================================================================
    MOCK_OPENAI: bool = Field(default=False, description="Mock Azure OpenAI for testing")
    MOCK_SENTINEL: bool = Field(default=False, description="Mock Sentinel for testing")
    TEST_MODE: bool = Field(default=False, description="Enable test mode")
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v):
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() == "development"


# Create global settings instance
settings = Settings()
