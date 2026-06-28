"""
Application settings loaded from environment variables / .env file.

Uses pydantic-settings so every field is type-validated at startup.
"""
from __future__ import annotations

import base64
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- App ----
    app_name: str = "BudgetWise AI Service"
    app_version: str = "0.1.0"
    app_port: int = 8000
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "https://budgetwise-frontend-fuuo.onrender.com",
            "http://localhost:8080",
        ]
    )

    # ---- JWT (same secret as Spring Boot Secure service) ----
    jwt_secret: str = (
        "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437"
    )
    jwt_algorithm: str = "HS256"

    # ---- LLM (Ollama OpenAI-compatible endpoint by default) ----
    llm_provider: str = "groq"  # "ollama" | "openai"
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_api_key: str = Field(default="")  # placeholder for ollama; real key for openai
    llm_model: str = "llama-3.3-70b-versatile"

    # ---- Embeddings (free local sentence-transformers by default) ----
    embedding_provider: str = "sentence-transformers"  # "sentence-transformers" | "openai"
    embedding_model: str = "all-MiniLM-L6-v2"

    # ---- Vector store ----
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "budgetwise_kb"

    # ---- Relational storage (SQLite, replaces Supabase) ----
    sqlite_url: str = "sqlite+aiosqlite:///./data/budgetwise_ai.db"

    # ---- Existing Spring Boot microservices ----
    backend_secure_url: str = "https://budgetwise-secure.onrender.com"
    backend_accounts_url: str = "https://budgetwise-accounts.onrender.com"
    backend_transactions_url: str = "https://budgetwise-transaction.onrender.com"
    backend_bills_url: str = "https://budgetwise-bills1.onrender.com"
    backend_category_url: str = "https://budgetwise-category.onrender.com"

    # ---- Chunking / retrieval ----
    chunk_size: int = 800
    chunk_overlap: int = 100
    top_k_results: int = 4

    # --- Derived helpers ---
    @property
    def jwt_secret_bytes(self) -> bytes:
        """Decode the Base64-encoded JWT secret.

        The Spring `Secure` service does the same thing:
            byte[] keyBytes = Decoders.BASE64.decode(SECRET);
            return Keys.hmacShaKeyFor(keyBytes);

        So we must Base64-decode before handing the key to PyJWT.
        """
        return base64.b64decode(self.jwt_secret)


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor."""
    return Settings()


# Convenience singleton for direct imports
settings = get_settings()
