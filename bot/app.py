import os
import logging
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Update

# Твои импорты (убедись, что пути верные)
from config import TELEGRAM_BOT_TOKEN
from database.database import db
from handlers.start import router as start_router
from handlers.chat import router as chat_router
from handlers.menu import router as menu_router
from handlers.settings import router as settings_router
from handlers.admin import router as admin_router
from handlers.tools import router as tools_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(
    token=TELEGRAM_BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
)
dp = Dispatcher()

dp.include_router(start_router)
dp.include_router(chat_router)
dp.include_router(menu_router)
dp.include_router(settings_router)
dp.include_router(admin_router)
dp.include_router(tools_router)

async def on_startup(app: web.Application):
    """Инициализация при запуске."""
    logger.info("🚀 Bot starting up on Render...")
    await db.init()
    logger.info("✅ Database initialized")
    
    # Render автоматически предоставляет этот URL
    base_url = os.getenv("RENDER_EXTERNAL_URL")
    if not base_url:
        logger.error("❌ RENDER_EXTERNAL_URL not found! Check Render settings.")
        return
        
    webhook_path = f"{base_url}/webhook"
    await bot.set_webhook(webhook_path)
    logger.info(f"✅ Webhook установлен на: {webhook_path}")

async def handle_webhook(request: web.Request):
    """Обработка входящих обновлений от Telegram."""
    try:
        data = await request.json()
        update = Update.model_validate(data, context={"bot": bot})
        await dp.feed_webhook_update(bot, update)
        return web.Response(text="OK")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return web.Response(text="Error", status=500)


async def health_check(request: web.Request):
    """Health check endpoint for Render."""
    return web.Response(text="✅ Bot is alive!")

# Создаем приложение
app = web.Application()
app.router.add_post("/webhook", handle_webhook)
app.router.add_get("/", health_check)  # <-- ДОБАВЬ ЭТУ СТРОКУ
app.on_startup.append(on_startup)        

# Создаем приложение
app = web.Application()
app.router.add_post("/webhook", handle_webhook)
app.on_startup.append(on_startup)

if __name__ == "__main__":
    # КРИТИЧЕСКИ ВАЖНО: Render требует слушать порт из переменной PORT (обычно 10000)
    port = int(os.getenv("PORT", 10000))
    logger.info(f"🌐 Starting web server on 0.0.0.0:{port}...")
    web.run_app(app, host="0.0.0.0", port=port, print=logger.info)