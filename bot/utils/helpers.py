import random
import string
import uuid
import hashlib
from datetime import datetime

def generate_password(length: int = 12) -> str:
    """Generate a random password."""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))

def generate_uuid() -> str:
    """Generate a UUID."""
    return str(uuid.uuid4())

def generate_random_number(min_val: int = 0, max_val: int = 100) -> int:
    """Generate a random number."""
    return random.randint(min_val, max_val)

def hash_text(text: str) -> str:
    """Hash text using SHA256."""
    return hashlib.sha256(text.encode()).hexdigest()

def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to max length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."

def format_datetime(dt: datetime) -> str:
    """Format datetime to readable string."""
    return dt.strftime("%d.%m.%Y %H:%M")

def escape_markdown(text: str) -> str:
    """Escape markdown special characters."""
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text
