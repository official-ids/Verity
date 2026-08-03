from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from datetime import datetime, date
from config import DATABASE_URL
from utils.logger import logger

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
        
        # Запускаем миграцию telegram_id после создания таблиц
        await self.migrate_telegram_id_to_integer()
    
    async def get_session(self) -> AsyncSession:
        return self.session_maker()
    
    async def migrate_telegram_id_to_integer(self):
        """Миграция telegram_id из String в Integer для SQLite."""
        async with self.engine.begin() as conn:
            try:
                # Проверяем существует ли таблица users
                result = await conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
                ))
                if not result.fetchone():
                    logger.info("Таблица users не существует, миграция не требуется")
                    return
                
                # Проверяем тип колонки telegram_id
                result = await conn.execute(text("PRAGMA table_info(users)"))
                columns = result.fetchall()
                
                telegram_id_col = None
                for col in columns:
                    if col[1] == 'telegram_id':  # col[1] = column name
                        telegram_id_col = col
                        break
                
                if not telegram_id_col:
                    logger.info("Колонка telegram_id не найдена")
                    return
                
                col_type = telegram_id_col[2].upper()  # col[2] = type
                logger.info(f"Текущий тип telegram_id: {col_type}")
                
                if 'INT' in col_type:
                    logger.info("telegram_id уже INTEGER, миграция не требуется")
                    return
                
                # Создаём временную таблицу
                logger.info("Начало миграции telegram_id...")
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS users_temp (
                        id INTEGER PRIMARY KEY,
                        telegram_id INTEGER UNIQUE NOT NULL,
                        username TEXT,
                        first_name TEXT,
                        last_name TEXT,
                        hf_api_key TEXT,
                        api_key_set BOOLEAN DEFAULT 0,
                        language TEXT DEFAULT 'ru',
                        current_model TEXT DEFAULT 'meta-llama/Meta-Llama-3-8B-Instruct',
                        temperature REAL DEFAULT 0.7,
                        system_prompt TEXT DEFAULT 'Ты полезный AI-ассистент.',
                        is_blocked BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Копируем данные, конвертируя telegram_id
                await conn.execute(text("""
                    INSERT INTO users_temp (id, telegram_id, username, first_name, last_name, 
                                            hf_api_key, api_key_set, language, current_model,
                                            temperature, system_prompt, is_blocked, created_at, updated_at)
                    SELECT id, CAST(telegram_id AS INTEGER), username, first_name, last_name,
                           hf_api_key, api_key_set, language, current_model,
                           temperature, system_prompt, is_blocked, created_at, updated_at
                    FROM users
                """))
                
                # Удаляем старую таблицу
                await conn.execute(text("DROP TABLE users"))
                
                # Переименовываем временную таблицу
                await conn.execute(text("ALTER TABLE users_temp RENAME TO users"))
                
                # Пересоздаём индексы
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_telegram_id ON users (telegram_id)"))
                
                logger.info("✅ Миграция telegram_id завершена успешно!")
                
            except Exception as e:
                logger.error(f"❌ Ошибка миграции: {e}")
                raise

db = Database()
