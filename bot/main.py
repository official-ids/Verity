from aiogram import Dispatcher, Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from config import TELEGRAM_BOT_TOKEN
from database.database import db
from utils.logger import logger

# Import routers
from handlers.start import router as start_router
from handlers.chat import router as chat_router
from handlers.menu import router as menu_router
from handlers.settings import router as settings_router
from handlers.admin import router as admin_router
from handlers.tools import router as tools_router


async def on_startup(bot: Bot):
    """Called when bot starts."""
    logger.info("Bot starting up...")
    
    # Initialize database
    await db.init()
    logger.info("Database initialized")
    
    # Set bot info
    bot_info = await bot.get_me()
    logger.info(f"Bot started: @{bot_info.username}")


async def on_shutdown(bot: Bot):
    """Called when bot shuts down."""
    logger.info("Bot shutting down...")


def create_dispatcher():
    """Create and configure dispatcher."""
    dp = Dispatcher()
    
    # Register routers
    dp.include_router(start_router)
    dp.include_router(chat_router)
    dp.include_router(menu_router)
    dp.include_router(settings_router)
    dp.include_router(admin_router)
    dp.include_router(tools_router)
    
    # Startup/Shutdown handlers
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)
    
    return dp


async def run_bot():
    """Run the bot."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found. Please set it in .env file")
        return
    
    bot = Bot(
        token=TELEGRAM_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
    )
    
    dp = create_dispatcher()
    
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Bot error: {str(e)}")
    finally:
        await bot.session.close()
