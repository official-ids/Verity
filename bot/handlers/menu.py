from aiogram import Router, F
from aiogram.types import CallbackQuery
from keyboards.main import (
    get_tools_inline_keyboard, get_coding_inline_keyboard, 
    get_text_inline_keyboard, get_utils_inline_keyboard,
    get_learning_inline_keyboard, get_main_keyboard
)

router = Router()


@router.callback_query(F.data == "main_menu")
async def main_menu_callback(callback: CallbackQuery):
    """Return to main menu."""
    await callback.message.edit_text(
        "🏠 Главное меню",
        reply_markup=get_main_keyboard()
    )


@router.callback_query(F.data == "tools_menu")
async def tools_menu_callback(callback: CallbackQuery):
    """Show tools menu."""
    await callback.message.edit_text(
        "🧠 **AI Инструменты**\n\nВыберите инструмент:",
        reply_markup=get_tools_inline_keyboard()
    )


@router.callback_query(F.data == "coding_menu")
async def coding_menu_callback(callback: CallbackQuery):
    """Show coding menu."""
    await callback.message.edit_text(
        "💻 **Кодинг**\n\nВыберите функцию:",
        reply_markup=get_coding_inline_keyboard()
    )


@router.callback_query(F.data == "text_menu")
async def text_menu_callback(callback: CallbackQuery):
    """Show text work menu."""
    await callback.message.edit_text(
        "✍️ **Работа с текстом**\n\nВыберите функцию:",
        reply_markup=get_text_inline_keyboard()
    )


@router.callback_query(F.data == "utils_menu")
async def utils_menu_callback(callback: CallbackQuery):
    """Show utilities menu."""
    await callback.message.edit_text(
        "🛠 **Утилиты**\n\nВыберите утилиту:",
        reply_markup=get_utils_inline_keyboard()
    )


@router.callback_query(F.data == "learning_menu")
async def learning_menu_callback(callback: CallbackQuery):
    """Show learning menu."""
    await callback.message.edit_text(
        "📚 **Обучение**\n\nВыберите функцию:",
        reply_markup=get_learning_inline_keyboard()
    )
