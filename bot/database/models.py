from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    # ✅ ИСПРАВЛЕНО: Integer вместо String!
    telegram_id = Column(Integer, unique=True, nullable=False, index=True) 
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hf_api_key = Column(String, nullable=True)
    api_key_set = Column(Boolean, default=False) # ✅ Оставили только один раз
    language = Column(String, default="ru")
    current_model = Column(String, default="meta-llama/Meta-Llama-3-8B-Instruct")
    temperature = Column(Float, default=0.7)
    system_prompt = Column(Text, default="Ты полезный AI-ассистент.")
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    usage_stats = relationship("UsageStats", back_populates="user", uselist=False, cascade="all, delete-orphan")


class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    model_used = Column(String, nullable=True)
    function_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_history")


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")


class UsageStats(Base):
    __tablename__ = "usage_stats"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_requests = Column(Integer, default=0)
    requests_today = Column(Integer, default=0)
    last_request_date = Column(DateTime, default=datetime.utcnow)
    total_tokens = Column(Integer, default=0)
    
    user = relationship("User", back_populates="usage_stats")


class ErrorLog(Base):
    __tablename__ = "error_logs"
    
    id = Column(Integer, primary_key=True)
    error_type = Column(String, nullable=False)
    error_message = Column(Text, nullable=False)
    user_id = Column(Integer, nullable=True) # ✅ Тоже лучше Integer
    created_at = Column(DateTime, default=datetime.utcnow)