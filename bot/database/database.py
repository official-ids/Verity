from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from datetime import datetime, date
from config import DATABASE_URL

Base = declarative_base()

class Database:
    def __init__(self):
        self.engine = None
        self.session_maker = None
    
    async def init(self):
        self.engine = create_async_engine(DATABASE_URL, echo=False)
        self.session_maker = async_sessionmaker(bind=self.engine, class_=AsyncSession, expire_on_commit=False)
        
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def get_session(self) -> AsyncSession:
        return self.session_maker()

db = Database()
