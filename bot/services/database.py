from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from typing import List, Optional
from database.models import User, ChatHistory, Favorite, UsageStats, ErrorLog

class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_or_create_user(self, telegram_id: str, username: str = None, 
                                  first_name: str = None, last_name: str = None) -> User:
        result = await self.session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                last_name=last_name
            )
            self.session.add(user)
            
            usage_stats = UsageStats(user_id=user.id)
            self.session.add(usage_stats)
            
            await self.session.commit()
            await self.session.refresh(user)
        else:
            user.username = username or user.username
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
            user.updated_at = datetime.utcnow()
            await self.session.commit()
        
        return user
    
    async def get_user(self, telegram_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        return result.scalar_one_or_none()
    
    async def update_user_settings(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        user.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def block_user(self, telegram_id: str):
        result = await self.session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.is_blocked = True
            await self.session.commit()
    
    async def unblock_user(self, telegram_id: str):
        result = await self.session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.is_blocked = False
            await self.session.commit()
    
    async def get_all_users(self) -> List[User]:
        result = await self.session.execute(select(User))
        return result.scalars().all()
    
    async def get_user_count(self) -> int:
        result = await self.session.execute(select(func.count(User.id)))
        return result.scalar()


class ChatHistoryService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def add_message(self, user_id: int, role: str, message: str, 
                          model_used: str = None, function_name: str = None):
        chat_msg = ChatHistory(
            user_id=user_id,
            role=role,
            message=message,
            model_used=model_used,
            function_name=function_name
        )
        self.session.add(chat_msg)
        await self.session.commit()
    
    async def get_history(self, user_id: int, limit: int = 20) -> List[ChatHistory]:
        result = await self.session.execute(
            select(ChatHistory)
            .where(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return list(reversed(messages))
    
    async def clear_history(self, user_id: int):
        await self.session.execute(
            ChatHistory.__table__.delete().where(ChatHistory.user_id == user_id)
        )
        await self.session.commit()
    
    async def get_context_messages(self, user_id: int, limit: int = 10) -> List[dict]:
        history = await self.get_history(user_id, limit)
        return [{"role": msg.role, "message": msg.message} for msg in history]


class FavoriteService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def add_favorite(self, user_id: int, message: str, category: str = "general"):
        favorite = Favorite(
            user_id=user_id,
            message=message,
            category=category
        )
        self.session.add(favorite)
        await self.session.commit()
    
    async def get_favorites(self, user_id: int) -> List[Favorite]:
        result = await self.session.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
        )
        return result.scalars().all()
    
    async def delete_favorite(self, favorite_id: int, user_id: int):
        result = await self.session.execute(
            select(Favorite).where(
                Favorite.id == favorite_id,
                Favorite.user_id == user_id
            )
        )
        favorite = result.scalar_one_or_none()
        if favorite:
            await self.session.delete(favorite)
            await self.session.commit()


class UsageStatsService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def increment_request(self, user_id: int):
        result = await self.session.execute(
            select(UsageStats).where(UsageStats.user_id == user_id)
        )
        stats = result.scalar_one_or_none()
        
        if stats:
            today = date.today()
            last_date = stats.last_request_date.date() if stats.last_request_date else None
            
            if last_date != today:
                stats.requests_today = 1
            else:
                stats.requests_today += 1
            
            stats.total_requests += 1
            stats.last_request_date = datetime.utcnow()
            await self.session.commit()
    
    async def get_stats(self, user_id: int) -> Optional[UsageStats]:
        result = await self.session.execute(
            select(UsageStats).where(UsageStats.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def check_limit(self, user_id: int, max_requests: int) -> bool:
        stats = await self.get_stats(user_id)
        if not stats:
            return True
        
        today = date.today()
        last_date = stats.last_request_date.date() if stats.last_request_date else None
        
        if last_date != today:
            return True
        
        return stats.requests_today < max_requests


class ErrorLogService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def log_error(self, error_type: str, error_message: str, user_id: str = None):
        error_log = ErrorLog(
            error_type=error_type,
            error_message=error_message,
            user_id=user_id
        )
        self.session.add(error_log)
        await self.session.commit()
    
    async def get_recent_errors(self, limit: int = 50) -> List[ErrorLog]:
        result = await self.session.execute(
            select(ErrorLog)
            .order_by(ErrorLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
