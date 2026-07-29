import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))

# Hugging Face API Configuration
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "meta-llama/Meta-Llama-3-8B-Instruct")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "google/gemma-2b-it")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///bot.db")

# Limits
MAX_REQUESTS_PER_DAY = int(os.getenv("MAX_REQUESTS_PER_DAY", "100"))
MAX_CONTEXT_MESSAGES = int(os.getenv("MAX_CONTEXT_MESSAGES", "20"))
MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "4000"))

# Available models
AVAILABLE_MODELS = [
    {"name": "Llama 3 8B", "model": "meta-llama/Meta-Llama-3-8B-Instruct"},
    {"name": "Gemma 2B", "model": "google/gemma-2b-it"},
    {"name": "Mistral 7B", "model": "mistralai/Mistral-7B-Instruct-v0.3"},
    {"name": "Phi-3 Mini", "model": "microsoft/Phi-3-mini-4k-instruct"},
    {"name": "Qwen2 7B", "model": "Qwen/Qwen2-7B-Instruct"},
]
