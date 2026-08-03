from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from database.database import db
from services.database import UserService, ChatHistoryService, UsageStatsService
from services.huggingface import hf_service
from keyboards.main import get_main_keyboard, get_back_keyboard
from config import MAX_REQUESTS_PER_DAY, MAX_MESSAGE_LENGTH
from utils.logger import logger

router = Router()


@router.message(F.text == "🤖 AI Чат")
async def ai_chat_menu(message: Message):
    """Show AI chat menu."""
    await message.answer(
        "🤖 **AI Чат**\n\nПросто напишите сообщение, и я отвечу с помощью искусственного интеллекта.\n\n"
        "💡 Вы можете:\n"
        "• Задавать вопросы\n"
        "• Просить помощи в решении задач\n"
        "• Обсуждать любые темы\n\n"
        "История сообщений сохраняется для контекста.",
        reply_markup=get_back_keyboard()
    )


@router.message(~F.text.in_(["🏠 Главное меню", "← Назад", "🤖 AI Чат", "🧠 AI Инструменты", 
                              "💻 Кодинг", "✍️ Работа с текстом", "🛠 Утилиты", "📚 Обучение",
                              "👤 Профиль", "⚙️ Настройки"]))
async def handle_ai_message(message: Message):
    """Handle AI chat messages."""
    async with await db.get_session() as session:
        user_service = UserService(session)
        chat_service = ChatHistoryService(session)
        stats_service = UsageStatsService(session)
        
        # Get or create user
        user = await user_service.get_or_create_user(
            telegram_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            last_name=message.from_user.last_name
        )
        
        logger.info(f"🔍 AI Chat check for user {message.from_user.id}: api_key_set={user.api_key_set}, hf_api_key={'***' + user.hf_api_key[-4:] if user.hf_api_key else 'None'}")
        
        # Check if blocked
        if user.is_blocked:
            await message.answer("❌ Ваш аккаунт заблокирован.")
            return
        
        # Check API key set
        if not user.api_key_set:
            logger.warning(f"⚠️ API key not set for user {message.from_user.id}")
            await message.answer(
                "⚠️ Сначала настройте API ключ Hugging Face в разделе ⚙️ Настройки → 🔑 API Key"
            )
            return
        
        # Check limit
        if not await stats_service.check_limit(user.id, MAX_REQUESTS_PER_DAY):
            await message.answer(
                "⚠️ Лимит запросов на сегодня исчерпан.\n"
                f"Максимум: {MAX_REQUESTS_PER_DAY} запросов в день.\n"
                "Попробуйте завтра."
            )
            return
        
        # Check message length
        if len(message.text) > MAX_MESSAGE_LENGTH:
            await message.answer(
                f"⚠️ Сообщение слишком длинное.\n"
                f"Максимальная длина: {MAX_MESSAGE_LENGTH} символов."
            )
            return
        
        # Save user message
        await chat_service.add_message(
            user_id=user.id,
            role="user",
            message=message.text
        )
        
        # Increment usage
        await stats_service.increment_request(user.id)
        
        # Get context
        context = await chat_service.get_context_messages(user.id, limit=10)
        
        # Show typing indicator
        await message.bot.send_chat_action(chat_id=message.chat.id, action="typing")
        
        try:
            # Generate response
            response = await hf_service.generate(
                prompt=message.text,
                model=user.current_model,
                temperature=user.temperature,
                system_prompt=user.system_prompt,
                conversation_history=context[:-1]  # Exclude current message
            )
            
            if response:
                # Truncate if too long
                if len(response) > 4000:
                    response = response[:3997] + "..."
                
                # Save assistant response
                await chat_service.add_message(
                    user_id=user.id,
                    role="assistant",
                    message=response,
                    model_used=user.current_model
                )
                
                await message.answer(response)
            else:
                await message.answer(
                    "⚠️ Сейчас AI временно недоступен. Попробуйте ещё раз через несколько секунд.\n\n"
                    "Возможные причины:\n"
                    "• Модель загружается\n"
                    "• Превышен лимит API\n"
                    "• Временные проблемы с сервером"
                )
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            await message.answer(
                "⚠️ Произошла ошибка при обработке запроса. Попробуйте позже."
            )
