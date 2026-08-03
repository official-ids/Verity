from aiogram import Router, F
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from database.database import db
from services.database import UserService, ChatHistoryService, UsageStatsService, ErrorLogService
from services.huggingface import hf_service
from keyboards.main import get_main_keyboard, get_back_keyboard
from config import ADMIN_ID, MAX_REQUESTS_PER_DAY
from utils.logger import logger

router = Router()


class BroadcastState(StatesGroup):
    message = State()


class BlockUserState(StatesGroup):
    user_id = State()


# Admin stats
@router.callback_query(F.data == "admin_stats")
async def admin_stats_callback(callback: CallbackQuery):
    """Show admin statistics."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    async with await db.get_session() as session:
        from services.database import UserService
        user_service = UserService(session)
        
        user_count = await user_service.get_user_count()
        
        text = f"""📊 **Статистика бота**

👥 Пользователей: {user_count}
📈 Лимит запросов/день: {MAX_REQUESTS_PER_DAY}

🔧 Версия: 1.0.0
🤖 AI: Hugging Face API"""
        
        await callback.message.edit_text(text)


# Admin users
@router.callback_query(F.data == "admin_users")
async def admin_users_callback(callback: CallbackQuery):
    """Show users list."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        users = await user_service.get_all_users()
        
        text = "👥 Пользователи:\n\n" # Убрал ** здесь, чтобы не ломалось
        for user in users[:20]:
            status = "🚫" if user.is_blocked else "✅"
            # Экранируем никнейм, если он есть, или пишем N/A
            username = user.username.replace("_", "\\_").replace("*", "\\*") if user.username else "N/A"
            text += f"{status} @{username} (`{user.telegram_id}`)\n"
        
        if len(users) > 20:
            text += f"\n... и ещё {len(users) - 20}"
        
        # ✅ ДОБАВЛЕНО: parse_mode=None, чтобы Telegram не пытался парсить никнеймы как Markdown
        await callback.message.edit_text(text, parse_mode=None)


# Admin errors
@router.callback_query(F.data == "admin_errors")
async def admin_errors_callback(callback: CallbackQuery):
    """Show recent errors."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    async with await db.get_session() as session:
        error_service = ErrorLogService(session)
        errors = await error_service.get_recent_errors(limit=10)
        
        if errors:
            text = "⚠️ **Последние ошибки:**\n\n"
            for error in errors:
                text += f"• {error.error_type}: {error.error_message[:50]}...\n"
            
            await callback.message.edit_text(text)
        else:
            await callback.message.edit_text("✅ Ошибок не найдено")


# Admin broadcast
@router.callback_query(F.data == "admin_broadcast")
async def admin_broadcast_callback(callback: CallbackQuery, state: FSMContext):
    """Start broadcast."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    await callback.message.answer(
        "📩 **Рассылка**\n\nОтправьте сообщение для рассылки всем пользователям:\n\n/cancel - отменить"
    )
    await state.set_state(BroadcastState.message)


@router.message(BroadcastState.message)
async def send_broadcast(message: Message, state: FSMContext):
    """Send broadcast to all users."""
    if message.from_user.id != ADMIN_ID:
        return
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        users = await user_service.get_all_users()
        
        sent_count = 0
        failed_count = 0
        
        for user in users:
            try:
                await message.bot.send_message(
                    chat_id=user.telegram_id,
                    text=f"📢 **Рассылка**\n\n{message.text}"
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to {user.telegram_id}: {e}")
                failed_count += 1
        
        await message.answer(
            f"✅ Рассылка завершена\n\n"
            f"Отправлено: {sent_count}\n"
            f"Не доставлено: {failed_count}",
            reply_markup=get_main_keyboard()
        )
    
    await state.clear()


# Admin block
@router.callback_query(F.data == "admin_block")
async def admin_block_callback(callback: CallbackQuery, state: FSMContext):
    """Block user."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    await callback.message.answer(
        "🚫 **Блокировка пользователя**\n\nОтправите Telegram ID пользователя:\n\n/cancel - отменить"
    )
    await state.set_state(BlockUserState.user_id)


@router.message(BlockUserState.user_id)
async def block_user(message: Message, state: FSMContext):
    """Block specified user."""
    if message.from_user.id != ADMIN_ID:
        return
    
    user_id = message.text.strip()
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        await user_service.block_user(user_id)
        
        await message.answer(
            f"✅ Пользователь {user_id} заблокирован",
            reply_markup=get_main_keyboard()
        )
    
    await state.clear()


# Admin unblock
@router.callback_query(F.data == "admin_unblock")
async def admin_unblock_callback(callback: CallbackQuery, state: FSMContext):
    """Unblock user."""
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("❌ Доступ запрещён", show_alert=True)
        return
    
    await callback.message.answer(
        "✅ **Разблокировка пользователя**\n\nОтправите Telegram ID пользователя:\n\n/cancel - отменить"
    )
    await state.set_state(BlockUserState.user_id)


@router.message(F.text == "admin_unblock_msg")
async def unblock_user(message: Message, state: FSMContext):
    """Unblock specified user."""
    if message.from_user.id != ADMIN_ID:
        return
    
    user_id = message.text.strip()
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        await user_service.unblock_user(user_id)
        
        await message.answer(
            f"✅ Пользователь {user_id} разблокирован",
            reply_markup=get_main_keyboard()
        )
    
    await state.clear()


# Menu button handlers
@router.message(F.text == "🧠 AI Инструменты")
async def tools_menu_button(message: Message):
    """Show tools menu from button."""
    from keyboards.main import get_tools_inline_keyboard
    await message.answer(
        "🧠 **AI Инструменты**\n\nВыберите инструмент:",
        reply_markup=get_tools_inline_keyboard()
    )


@router.message(F.text == "💻 Кодинг")
async def coding_menu_button(message: Message):
    """Show coding menu from button."""
    from keyboards.main import get_coding_inline_keyboard
    await message.answer(
        "💻 **Кодинг**\n\nВыберите функцию:",
        reply_markup=get_coding_inline_keyboard()
    )


@router.message(F.text == "✍️ Работа с текстом")
async def text_menu_button(message: Message):
    """Show text menu from button."""
    from keyboards.main import get_text_inline_keyboard
    await message.answer(
        "✍️ **Работа с текстом**\n\nВыберите функцию:",
        reply_markup=get_text_inline_keyboard()
    )


@router.message(F.text == "🛠 Утилиты")
async def utils_menu_button(message: Message):
    """Show utils menu from button."""
    from keyboards.main import get_utils_inline_keyboard
    await message.answer(
        "🛠 **Утилиты**\n\nВыберите утилиту:",
        reply_markup=get_utils_inline_keyboard()
    )


@router.message(F.text == "📚 Обучение")
async def learning_menu_button(message: Message):
    """Show learning menu from button."""
    from keyboards.main import get_learning_inline_keyboard
    await message.answer(
        "📚 **Обучение**\n\nВыберите функцию:",
        reply_markup=get_learning_inline_keyboard()
    )


@router.message(F.text == "👤 Профиль")
async def profile_menu_button(message: Message):
    """Show profile menu from button."""
    from keyboards.main import get_profile_inline_keyboard
    await message.answer(
        "👤 **Профиль**\n\nВыберите раздел:",
        reply_markup=get_profile_inline_keyboard()
    )


@router.message(F.text == "⚙️ Настройки")
async def settings_menu_button(message: Message):
    """Show settings menu from button."""
    from keyboards.main import get_settings_inline_keyboard
    await message.answer(
        "⚙️ **Настройки**\n\nВыберите параметр:",
        reply_markup=get_settings_inline_keyboard()
    )
