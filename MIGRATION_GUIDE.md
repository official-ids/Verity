# 🛠 Миграция БД: String → Integer для telegram_id

## Проблема
Ранее `telegram_id` был типа `String`, теперь изменён на `Integer`. 
Старые записи в базе могут не находиться из-за несоответствия типов.

## Решение для Render (бесплатный тариф без Shell)

### Вариант 1: Автоматическая миграция при старте (РЕКОМЕНДУЕТСЯ)

Добавьте этот код в `bot/database/database.py` после создания движка:

```python
# В конце файла database.py, после create_db_and_drop() или аналогичной функции

async def migrate_telegram_id_to_integer():
    """Миграция telegram_id из String в Integer."""
    from sqlalchemy import text
    
    async with engine.begin() as conn:
        # Для SQLite нужно создать новую таблицу и перенести данные
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
            
            await conn.commit()
            logger.info("✅ Миграция telegram_id завершена успешно!")
            
        except Exception as e:
            logger.error(f"❌ Ошибка миграции: {e}")
            raise
```

Вызовите эту функцию в `bot/main.py` или `bot/app.py` при старте:

```python
# В main() или startup функции
from database.database import db, migrate_telegram_id_to_integer

async def on_startup():
    await migrate_telegram_id_to_integer()
    # ... остальной код
```

---

### Вариант 2: Сброс БД (если данные не важны)

Если база небольшая и пользователи не критичны, можно просто удалить файл БД:

1. **В config.py добавьте:**
```python
RESET_DATABASE_ON_START = True  # Добавить флаг
```

2. **В database.py добавьте функцию:**
```python
async def reset_database():
    """Полный сброс базы данных."""
    async with engine.begin() as conn:
        # Удаляем все таблицы
        await conn.run_sync(Base.metadata.drop_all)
        # Создаём заново
        await conn.run_sync(Base.metadata.create_all)
        logger.info("🗑 База данных сброшена")
```

3. **Вызовите при старте если флаг установлен:**
```python
if config.RESET_DATABASE_ON_START:
    await db.reset_database()
```

На Render это сработает автоматически при следующем деплое.

---

### Вариант 3: Ручное удаление через PythonAnywhere/консоль

Если есть доступ к консоли Render (через веб-терминал):

```bash
cd /workspace
rm bot/data/bot.db  # или путь к вашей БД
```

Или создайте временный handler:

```python
# bot/handlers/admin.py - только для ADMIN_ID
@router.message(Command("reset_db"))
async def cmd_reset_db(message: Message):
    if message.from_user.id != ADMIN_ID:
        return
    
    import os
    db_path = "bot/data/bot.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        await message.answer("✅ База данных удалена. Перезапустите бота.")
    else:
        await message.answer("Файл БД не найден")
```

Отправьте `/reset_db` боту (только администратору!).

---

## Проверка после миграции

После миграции проверьте логи:

```
💾 Save API key for user: telegram_id=123456789 (type: int)
🔍 User found: True
✅ API key saved: api_key_set=True, hf_api_key=***xyz123
```

Если видите `User found: False` — миграция прошла успешно, старые пользователи не найдены (так как их telegram_id были строками).

---

## Важно!

После развёртывания исправлений:
1. Все новые пользователи будут создаваться с правильным типом `telegram_id` (int)
2. Старые пользователи должны будут нажать `/start` для обновления записи
3. API ключи старых пользователей могут потеряться при миграции — предупредите их
