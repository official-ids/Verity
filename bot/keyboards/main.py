from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

def get_main_keyboard() -> ReplyKeyboardMarkup:
    """Main menu keyboard."""
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🤖 AI Чат"), KeyboardButton(text="🧠 AI Инструменты")],
            [KeyboardButton(text="💻 Кодинг"), KeyboardButton(text="✍️ Работа с текстом")],
            [KeyboardButton(text="🛠 Утилиты"), KeyboardButton(text="📚 Обучение")],
            [KeyboardButton(text="👤 Профиль"), KeyboardButton(text="⚙️ Настройки")],
        ],
        resize_keyboard=True
    )
    return keyboard


def get_back_keyboard() -> ReplyKeyboardMarkup:
    """Back button keyboard."""
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🏠 Главное меню")],
            [KeyboardButton(text="← Назад")]
        ],
        resize_keyboard=True
    )
    return keyboard


def get_tools_inline_keyboard() -> InlineKeyboardMarkup:
    """AI Tools inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="💡 Генератор идей", callback_data="tool_ideas"),
            InlineKeyboardButton(text="📝 Суммаризация", callback_data="tool_summary"),
        ],
        [
            InlineKeyboardButton(text="🌐 Переводчик", callback_data="tool_translate"),
            InlineKeyboardButton(text="✏️ Рерайтер", callback_data="tool_rewrite"),
        ],
        [
            InlineKeyboardButton(text="📊 Анализ текста", callback_data="tool_analyze"),
            InlineKeyboardButton(text="😊 Тональность", callback_data="tool_sentiment"),
        ],
        [
            InlineKeyboardButton(text="📋 Форматировать JSON", callback_data="tool_json"),
            InlineKeyboardButton(text="📄 Форматировать MD", callback_data="tool_markdown"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_coding_inline_keyboard() -> InlineKeyboardMarkup:
    """Coding inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="💻 Генератор кода", callback_data="code_generate"),
            InlineKeyboardButton(text="🔍 Объяснение кода", callback_data="code_explain"),
        ],
        [
            InlineKeyboardButton(text="🐛 Исправление ошибок", callback_data="code_fix"),
            InlineKeyboardButton(text="♻️ Рефакторинг", callback_data="code_refactor"),
        ],
        [
            InlineKeyboardButton(text="⚡ Оптимизация", callback_data="code_optimize"),
            InlineKeyboardButton(text="🔄 Конвертация", callback_data="code_convert"),
        ],
        [
            InlineKeyboardButton(text="🤖 Roblox Studio", callback_data="code_roblox"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_text_inline_keyboard() -> InlineKeyboardMarkup:
    """Text work inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✍️ Улучшение текста", callback_data="text_improve"),
            InlineKeyboardButton(text="✅ Исправление ошибок", callback_data="text_fix"),
        ],
        [
            InlineKeyboardButton(text="📝 Сокращение", callback_data="text_shorten"),
            InlineKeyboardButton(text="📈 Расширение", callback_data="text_expand"),
        ],
        [
            InlineKeyboardButton(text="🎯 Заголовки", callback_data="text_titles"),
            InlineKeyboardButton(text="📝 Описания", callback_data="text_descriptions"),
        ],
        [
            InlineKeyboardButton(text="📱 Посты", callback_data="text_posts"),
            InlineKeyboardButton(text="📢 Реклама", callback_data="text_ads"),
        ],
        [
            InlineKeyboardButton(text="🎬 Сценарии", callback_data="text_scripts"),
            InlineKeyboardButton(text="📖 Истории", callback_data="text_stories"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_utils_inline_keyboard() -> InlineKeyboardMarkup:
    """Utilities inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔢 Калькулятор", callback_data="util_calc"),
            InlineKeyboardButton(text="📏 Конвертер единиц", callback_data="util_convert"),
        ],
        [
            InlineKeyboardButton(text="🎲 Случайное число", callback_data="util_random"),
            InlineKeyboardButton(text="🔐 Генератор паролей", callback_data="util_password"),
        ],
        [
            InlineKeyboardButton(text="🆔 Генератор UUID", callback_data="util_uuid"),
            InlineKeyboardButton(text="📱 QR-коды", callback_data="util_qr"),
        ],
        [
            InlineKeyboardButton(text="📋 Таблицы", callback_data="util_tables"),
            InlineKeyboardButton(text="✅ Чек-листы", callback_data="util_checklist"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_learning_inline_keyboard() -> InlineKeyboardMarkup:
    """Learning inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="❓ Ответы на вопросы", callback_data="learn_qa"),
            InlineKeyboardButton(text="📚 Объяснение тем", callback_data="learn_explain"),
        ],
        [
            InlineKeyboardButton(text="🎓 Обучающий режим", callback_data="learn_teach"),
            InlineKeyboardButton(text="📝 Конспекты", callback_data="learn_notes"),
        ],
        [
            InlineKeyboardButton(text="📋 Шпаргалки", callback_data="learn_cheatsheet"),
            InlineKeyboardButton(text="📊 Тесты", callback_data="learn_test"),
        ],
        [
            InlineKeyboardButton(text="🎯 Викторины", callback_data="learn_quiz"),
            InlineKeyboardButton(text="📅 План обучения", callback_data="learn_plan"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_settings_inline_keyboard() -> InlineKeyboardMarkup:
    """Settings inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🤖 Выбор модели", callback_data="settings_model"),
            InlineKeyboardButton(text="🌐 Язык", callback_data="settings_language"),
        ],
        [
            InlineKeyboardButton(text="🌡 Температура", callback_data="settings_temperature"),
            InlineKeyboardButton(text="📝 Системный промпт", callback_data="settings_prompt"),
        ],
        [
            InlineKeyboardButton(text="🗑 Очистить историю", callback_data="settings_clear"),
            InlineKeyboardButton(text="🔄 Новый чат", callback_data="settings_new_chat"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_profile_inline_keyboard() -> InlineKeyboardMarkup:
    """Profile inline keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статистика", callback_data="profile_stats"),
            InlineKeyboardButton(text="📜 История", callback_data="profile_history"),
        ],
        [
            InlineKeyboardButton(text="⭐ Избранное", callback_data="profile_favorites"),
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")
        ]
    ])
    return keyboard


def get_models_inline_keyboard(current_model: str) -> InlineKeyboardMarkup:
    """Models selection keyboard."""
    from config import AVAILABLE_MODELS
    
    buttons = []
    for model_info in AVAILABLE_MODELS:
        is_current = "✓" if model_info["model"] == current_model else ""
        buttons.append([
            InlineKeyboardButton(
                text=f"{model_info['name']} {is_current}",
                callback_data=f"model_{model_info['model']}"
            )
        ])
    
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="settings_menu")])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    return keyboard


def get_yes_no_keyboard() -> InlineKeyboardMarkup:
    """Yes/No confirmation keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да", callback_data="confirm_yes"),
            InlineKeyboardButton(text="❌ Нет", callback_data="confirm_no"),
        ]
    ])
    return keyboard


def get_admin_keyboard() -> InlineKeyboardMarkup:
    """Admin panel keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats"),
            InlineKeyboardButton(text="👥 Пользователи", callback_data="admin_users"),
        ],
        [
            InlineKeyboardButton(text="⚠️ Ошибки", callback_data="admin_errors"),
            InlineKeyboardButton(text="📩 Рассылка", callback_data="admin_broadcast"),
        ],
        [
            InlineKeyboardButton(text="🚫 Блокировка", callback_data="admin_block"),
            InlineKeyboardButton(text="✅ Разблокировка", callback_data="admin_unblock"),
        ]
    ])
    return keyboard
