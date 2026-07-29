from aiogram import Router, F
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from database.database import db
from services.database import UserService, ChatHistoryService, UsageStatsService
from services.huggingface import hf_service
from keyboards.main import get_back_keyboard
from utils.logger import logger

router = Router()


# Tool functions with AI prompts
TOOL_PROMPTS = {
    "tool_ideas": "Придумай 5 креативных идей для: ",
    "tool_summary": "Сделай краткое содержание текста (не более 100 слов):\n",
    "tool_translate": "Переведи текст на русский язык:\n",
    "tool_rewrite": "Перепиши текст другими словами, сохранив смысл:\n",
    "tool_analyze": "Проанализируй текст и выдели основные тезисы:\n",
    "tool_sentiment": "Определи тональность текста (позитивная/негативная/нейтральная) и объясни:\n",
    "tool_json": "Отформатируй этот JSON, сделай его читаемым:\n",
    "tool_markdown": "Отформатируй текст в Markdown:\n",
    
    # Coding
    "code_generate": "Напиши код для: ",
    "code_explain": "Объясни, что делает этот код:\n",
    "code_fix": "Найди и исправь ошибки в коде:\n",
    "code_refactor": "Улучши и рефактори этот код:\n",
    "code_optimize": "Оптимизируй этот код для лучшей производительности:\n",
    "code_convert": "Конвертируй этот код в другой язык программирования:\n",
    "code_roblox": "Помоги с Roblox Studio (Luau): ",
    
    # Text
    "text_improve": "Улучши этот текст, сделай его более качественным:\n",
    "text_fix": "Исправь грамматические и стилистические ошибки:\n",
    "text_shorten": "Сократи текст, сохранив основную информацию:\n",
    "text_expand": "Расширь текст, добавив детали:\n",
    "text_titles": "Придумай 5 цепляющих заголовков для:\n",
    "text_descriptions": "Напиши описание для:\n",
    "text_posts": "Напиши пост для соцсетей на тему:\n",
    "text_ads": "Напиши рекламный текст для:\n",
    "text_scripts": "Напиши сценарий для:\n",
    "text_stories": "Напиши короткую историю на тему:\n",
    
    # Learning
    "learn_qa": "Ответь на вопрос подробно и точно:\n",
    "learn_explain": "Объясни эту тему просто и понятно, как новичку:\n",
    "learn_teach": "Обучи меня этой теме пошагово:\n",
    "learn_notes": "Сделай конспект по теме:\n",
    "learn_cheatsheet": "Создай шпаргалку по теме:\n",
    "learn_test": "Создай тест с вопросами по теме:\n",
    "learn_quiz": "Создай викторину с вариантами ответов:\n",
    "learn_plan": "Составь план обучения по теме:\n",
}


class FunctionState(StatesGroup):
    input_text = State()


@router.callback_query(F.data.startswith(("tool_", "code_", "text_", "learn_", "util_")))
async def tool_callback(callback: CallbackQuery, state: FSMContext):
    """Handle tool selection."""
    function = callback.data
    
    if function in ["util_password", "util_uuid", "util_random", "util_calc", "util_convert", "util_qr", "util_tables", "util_checklist"]:
        # Handle utility functions directly
        await handle_utility(callback, function)
        return
    
    prompt_info = TOOL_PROMPTS.get(function, "")
    
    await callback.message.answer(
        f"📝 **{get_function_name(function)}**\n\n"
        f"{prompt_info}\n\n"
        "Отправьте текст или описание:\n\n/cancel - отменить"
    )
    
    await state.set_state(FunctionState.input_text)
    await state.update_data(function=function)


async def handle_utility(callback: CallbackQuery, function: str):
    """Handle utility functions without AI."""
    from utils.helpers import generate_password, generate_uuid, generate_random_number
    
    if function == "util_calc":
        await callback.message.answer("🔢 **Калькулятор**\n\nОтправьте математическое выражение:")
        return
    
    if function == "util_convert":
        await callback.message.answer(
            "📏 **Конвертер единиц**\n\nПримеры:\n• 10 км в мили\n• 100°F в °C\n• 5 кг в фунты"
        )
        return
    
    if function == "util_qr":
        await callback.message.answer("📱 **QR-коды**\n\nОтправьте текст или URL для генерации QR-кода:")
        return
    
    if function == "util_tables":
        await callback.message.answer("📋 **Таблицы**\n\nОпишите, какую таблицу нужно создать:")
        return
    
    if function == "util_checklist":
        await callback.message.answer("✅ **Чек-листы**\n\nОпишите, для чего нужен чек-лист:")
        return


@router.message(FunctionState.input_text)
async def process_function(message: Message, state: FSMContext):
    """Process AI function request."""
    data = await state.get_data()
    function = data.get("function")
    user_input = message.text
    
    if user_input == "/cancel":
        await message.answer("❌ Отменено", reply_markup=get_back_keyboard())
        await state.clear()
        return
    
    async with await db.get_session() as session:
        user_service = UserService(session)
        chat_service = ChatHistoryService(session)
        stats_service = UsageStatsService(session)
        
        user = await user_service.get_user(str(message.from_user.id))
        
        if not user or not user.api_key_set:
            await message.answer("⚠️ Сначала настройте API ключ в разделе Настройки")
            await state.clear()
            return
        
        # Check limit
        if not await stats_service.check_limit(user.id, MAX_REQUESTS_PER_DAY):
            await message.answer("⚠️ Лимит запросов исчерпан")
            await state.clear()
            return
        
        # Build prompt
        prompt_prefix = TOOL_PROMPTS.get(function, "")
        full_prompt = f"{prompt_prefix}{user_input}"
        
        # Save user message
        await chat_service.add_message(
            user_id=user.id,
            role="user",
            message=user_input,
            function_name=function
        )
        
        # Increment usage
        await stats_service.increment_request(user.id)
        
        # Show typing
        await message.bot.send_chat_action(chat_id=message.chat.id, action="typing")
        
        try:
            response = await hf_service.generate(
                prompt=full_prompt,
                model=user.current_model,
                temperature=user.temperature,
                system_prompt=user.system_prompt
            )
            
            if response:
                if len(response) > 4000:
                    response = response[:3997] + "..."
                
                await chat_service.add_message(
                    user_id=user.id,
                    role="assistant",
                    message=response,
                    model_used=user.current_model,
                    function_name=function
                )
                
                await message.answer(f"✅ **Результат:**\n\n{response}")
            else:
                await message.answer("⚠️ AI временно недоступен. Попробуйте позже.")
                
        except Exception as e:
            logger.error(f"Error in function {function}: {str(e)}")
            await message.answer("⚠️ Произошла ошибка. Попробуйте позже.")
        
        await state.clear()


def get_function_name(function: str) -> str:
    """Get human-readable function name."""
    names = {
        "tool_ideas": "💡 Генератор идей",
        "tool_summary": "📝 Суммаризация",
        "tool_translate": "🌐 Переводчик",
        "tool_rewrite": "✏️ Рерайтер",
        "tool_analyze": "📊 Анализ текста",
        "tool_sentiment": "😊 Тональность",
        "tool_json": "📋 Форматировать JSON",
        "tool_markdown": "📄 Форматировать MD",
        "code_generate": "💻 Генератор кода",
        "code_explain": "🔍 Объяснение кода",
        "code_fix": "🐛 Исправление ошибок",
        "code_refactor": "♻️ Рефакторинг",
        "code_optimize": "⚡ Оптимизация",
        "code_convert": "🔄 Конвертация",
        "code_roblox": "🤖 Roblox Studio",
        "text_improve": "✍️ Улучшение текста",
        "text_fix": "✅ Исправление ошибок",
        "text_shorten": "📝 Сокращение",
        "text_expand": "📈 Расширение",
        "text_titles": "🎯 Заголовки",
        "text_descriptions": "📝 Описания",
        "text_posts": "📱 Посты",
        "text_ads": "📢 Реклама",
        "text_scripts": "🎬 Сценарии",
        "text_stories": "📖 Истории",
        "learn_qa": "❓ Ответы на вопросы",
        "learn_explain": "📚 Объяснение тем",
        "learn_teach": "🎓 Обучающий режим",
        "learn_notes": "📝 Конспекты",
        "learn_cheatsheet": "📋 Шпаргалки",
        "learn_test": "📊 Тесты",
        "learn_quiz": "🎯 Викторины",
        "learn_plan": "📅 План обучения",
    }
    return names.get(function, function)


# Import for limit check
from config import MAX_REQUESTS_PER_DAY
