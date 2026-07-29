from aiogram import Router, F
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message, FSInputFile
from aiogram.fsm.context import FSMContext
from database.database import db
from services.database import UserService, ChatHistoryService, FavoriteService, UsageStatsService
from services.huggingface import hf_service
from keyboards.main import (
    get_settings_inline_keyboard, get_profile_inline_keyboard, 
    get_models_inline_keyboard, get_main_keyboard, get_yes_no_keyboard,
    get_back_keyboard
)
from config import AVAILABLE_MODELS, MAX_REQUESTS_PER_DAY
from utils.helpers import generate_password, generate_uuid, generate_random_number
from utils.logger import logger
import io

router = Router()


# Settings handlers
@router.callback_query(F.data == "settings_menu")
async def settings_menu_callback(callback: CallbackQuery):
    """Show settings menu."""
    await callback.message.edit_text(
        "⚙️ **Настройки**\n\nВыберите параметр:",
        reply_markup=get_settings_inline_keyboard()
    )


@router.callback_query(F.data == "settings_model")
async def settings_model_callback(callback: CallbackQuery):
    """Show model selection."""
    async with await db.get_session() as session:
        user_service = UserService(session)
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            keyboard = get_models_inline_keyboard(user.current_model)
            await callback.message.edit_text(
                "🤖 **Выбор модели**\n\nТекущая модель будет использоваться для генерации ответов.",
                reply_markup=keyboard
            )


@router.callback_query(F.data.startswith("model_"))
async def select_model_callback(callback: CallbackQuery):
    """Select AI model."""
    model = callback.data.replace("model_", "")
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            await user_service.update_user_settings(user, current_model=model)
            await callback.message.edit_text(
                f"✅ Модель изменена на: {model}",
                reply_markup=get_settings_inline_keyboard()
            )


class TemperatureState(StatesGroup):
    temperature = State()


@router.callback_query(F.data == "settings_temperature")
async def settings_temperature_callback(callback: CallbackQuery, state: FSMContext):
    """Set temperature."""
    await callback.message.answer(
        "🌡 **Температура**\n\n"
        "Отправьте число от 0.1 до 1.0:\n"
        "• 0.1-0.3 - Более точные ответы\n"
        "• 0.5-0.7 - Сбалансированные\n"
        "• 0.8-1.0 - Более креативные\n\n"
        "Текущее значение будет показано в профиле.\n\n"
        "/cancel - отменить"
    )
    await state.set_state(TemperatureState.temperature)


@router.message(TemperatureState.temperature)
async def set_temperature(message: Message, state: FSMContext):
    """Save temperature."""
    try:
        temp = float(message.text)
        if 0.1 <= temp <= 1.0:
            async with await db.get_session() as session:
                user_service = UserService(session)
                user = await user_service.get_user(str(message.from_user.id))
                
                if user:
                    await user_service.update_user_settings(user, temperature=temp)
                    await message.answer(
                        f"✅ Температура установлена: {temp}",
                        reply_markup=get_settings_inline_keyboard()
                    )
        else:
            await message.answer("❌ Число должно быть от 0.1 до 1.0")
    except ValueError:
        await message.answer("❌ Введите корректное число")
    
    await state.clear()


@router.callback_query(F.data == "settings_clear")
async def settings_clear_callback(callback: CallbackQuery):
    """Clear chat history."""
    await callback.message.edit_text(
        "🗑 **Очистить историю?**\n\nЭто действие нельзя отменить.",
        reply_markup=get_yes_no_keyboard()
    )


@router.callback_query(F.data == "confirm_yes")
async def confirm_clear_callback(callback: CallbackQuery):
    """Confirm clear history."""
    async with await db.get_session() as session:
        chat_service = ChatHistoryService(session)
        user_service = UserService(session)
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            await chat_service.clear_history(user.id)
            await callback.message.edit_text(
                "✅ История очищена",
                reply_markup=get_settings_inline_keyboard()
            )


@router.callback_query(F.data == "confirm_no")
async def cancel_clear_callback(callback: CallbackQuery):
    """Cancel clear history."""
    await callback.message.edit_text(
        "❌ Отменено",
        reply_markup=get_settings_inline_keyboard()
    )


@router.callback_query(F.data == "settings_new_chat")
async def new_chat_callback(callback: CallbackQuery):
    """Start new chat."""
    async with await db.get_session() as session:
        chat_service = ChatHistoryService(session)
        user_service = UserService(session)
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            await chat_service.clear_history(user.id)
            await callback.message.edit_text(
                "🔄 Новый чат начат! История очищена.",
                reply_markup=get_main_keyboard()
            )


class PromptState(StatesGroup):
    prompt = State()


@router.callback_query(F.data == "settings_prompt")
async def settings_prompt_callback(callback: CallbackQuery, state: FSMContext):
    """Set system prompt."""
    await callback.message.answer(
        "📝 **Системный промпт**\n\n"
        "Отправьте текст, который будет определять поведение AI.\n\n"
        "Пример: \"Ты опытный программист\" или \"Ты поэт\"\n\n"
        "/cancel - отменить"
    )
    await state.set_state(PromptState.prompt)


@router.message(PromptState.prompt)
async def set_prompt(message: Message, state: FSMContext):
    """Save system prompt."""
    async with await db.get_session() as session:
        user_service = UserService(session)
        user = await user_service.get_user(str(message.from_user.id))
        
        if user:
            await user_service.update_user_settings(user, system_prompt=message.text)
            await message.answer(
                f"✅ Системный промпт установлен",
                reply_markup=get_settings_inline_keyboard()
            )
    
    await state.clear()


# Profile handlers
@router.callback_query(F.data == "profile_menu")
async def profile_menu_callback(callback: CallbackQuery):
    """Show profile menu."""
    await callback.message.edit_text(
        "👤 **Профиль**\n\nВыберите раздел:",
        reply_markup=get_profile_inline_keyboard()
    )


@router.callback_query(F.data == "profile_stats")
async def profile_stats_callback(callback: CallbackQuery):
    """Show user statistics."""
    async with await db.get_session() as session:
        user_service = UserService(session)
        stats_service = UsageStatsService(session)
        
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            stats = await stats_service.get_stats(user.id)
            
            text = f"""📊 **Статистика**

👤 Пользователь: @{user.username or 'N/A'}
🤖 Модель: {user.current_model}
🌡 Температура: {user.temperature}

📈 Запросы:
• Всего: {stats.total_requests if stats else 0}
• Сегодня: {stats.requests_today if stats else 0}
• Лимит: {MAX_REQUESTS_PER_DAY}/день"""
            
            await callback.message.edit_text(text)


@router.callback_query(F.data == "profile_history")
async def profile_history_callback(callback: CallbackQuery):
    """Show chat history."""
    async with await db.get_session() as session:
        chat_service = ChatHistoryService(session)
        user_service = UserService(session)
        
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            history = await chat_service.get_history(user.id, limit=10)
            
            if history:
                text = "📜 **Последние сообщения:**\n\n"
                for msg in history[-5:]:
                    role = "👤 Вы" if msg.role == "user" else "🤖 AI"
                    preview = msg.message[:50] + "..." if len(msg.message) > 50 else msg.message
                    text += f"{role}: {preview}\n\n"
                
                await callback.message.edit_text(text)
            else:
                await callback.message.edit_text("📜 История пуста")


@router.callback_query(F.data == "profile_favorites")
async def profile_favorites_callback(callback: CallbackQuery):
    """Show favorites."""
    async with await db.get_session() as session:
        fav_service = FavoriteService(session)
        user_service = UserService(session)
        
        user = await user_service.get_user(str(callback.from_user.id))
        
        if user:
            favorites = await fav_service.get_favorites(user.id)
            
            if favorites:
                text = "⭐ **Избранное:**\n\n"
                for fav in favorites[:5]:
                    preview = fav.message[:50] + "..." if len(fav.message) > 50 else fav.message
                    text += f"• {preview}\n\n"
                
                await callback.message.edit_text(text)
            else:
                await callback.message.edit_text("⭐ Избранное пусто")


# Utility function handlers
@router.callback_query(F.data == "util_password")
async def util_password_callback(callback: CallbackQuery):
    """Generate password."""
    password = generate_password(16)
    await callback.message.answer(f"🔐 **Случайный пароль:**\n\n`{password}`")


@router.callback_query(F.data == "util_uuid")
async def util_uuid_callback(callback: CallbackQuery):
    """Generate UUID."""
    uuid = generate_uuid()
    await callback.message.answer(f"🆔 **UUID:**\n\n`{uuid}`")


@router.callback_query(F.data == "util_random")
async def util_random_callback(callback: CallbackQuery):
    """Generate random number."""
    number = generate_random_number(1, 100)
    await callback.message.answer(f"🎲 **Случайное число:** {number}")
