from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from database.database import db
from services.database import UserService, UsageStatsService
from keyboards.main import get_main_keyboard, get_admin_keyboard
from config import ADMIN_ID
from utils.logger import logger

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message):
    """Handle /start command."""
    # ✅ ВАЖНО: передаем message.from_user.id как целое число (int), а не строку!
    user_id_int = message.from_user.id 
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        user = await user_service.get_or_create_user(
            telegram_id=user_id_int,  # <--- УБРАЛИ str()
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            last_name=message.from_user.last_name
        )
    
    welcome_text = f"""👋 Привет, {message.from_user.first_name}!

Я твой персональный AI-ассистент с более чем 50 функциями!

🤖 Я могу:
• Отвечать на вопросы
• Помогать с кодом
• Работать с текстом
• Генерировать контент
• И многое другое!

Выбери раздел в меню ниже или просто напиши мне сообщение для AI-чата.

⚙️ Для начала работы настрой API ключ в разделе Настройки."""
    
    await message.answer(
        welcome_text,
        reply_markup=get_main_keyboard()
    )
    
    if user_id_int == ADMIN_ID:
        await message.answer(
            "🔧 Вы администратор. Используйте /admin для доступа к панели управления.",
            reply_markup=get_admin_keyboard()
        )


@router.message(Command("admin"))
async def cmd_admin(message: Message):
    """Show admin panel."""
    if message.from_user.id != ADMIN_ID:
        await message.answer("❌ Доступ запрещён")
        return
    
    await message.answer(
        "🔧 Админ-панель",
        reply_markup=get_admin_keyboard()
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    """Show help information."""
    help_text = """📚 Справка по боту

🤖 **AI Чат** - Просто напишите сообщение для общения с AI

🧠 **AI Инструменты**:
• Генератор идей, суммаризация
• Переводчик, рерайтер
• Анализ текста, тональность
• Форматирование JSON/Markdown

💻 **Кодинг**:
• Генерация и объяснение кода
• Исправление ошибок, рефакторинг
• Поддержка Roblox Studio

✍️ **Работа с текстом**:
• Улучшение, исправление ошибок
• Сокращение, расширение
• Заголовки, описания, посты
• Сценарии, истории

🛠 **Утилиты**:
• Калькулятор, конвертер
• Генератор паролей, UUID
• QR-коды, таблицы

📚 **Обучение**:
• Ответы на вопросы
• Объяснение тем
• Конспекты, тесты, викторины

👤 **Профиль** - Статистика, история, избранное
⚙️ **Настройки** - Модель, язык, температура

💡 Совет: Используйте кнопку "🗑 Очистить контекст" для начала нового диалога."""
    
    await message.answer(help_text)


@router.message(F.text == "🏠 Главное меню")
async def main_menu(message: Message):
    """Return to main menu."""
    await message.answer(
        "🏠 Главное меню",
        reply_markup=get_main_keyboard()
    )
