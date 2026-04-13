import asyncio
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery, LabeledPrice, PreCheckoutQuery,
    InlineKeyboardMarkup, InlineKeyboardButton
)
from aiogram.filters import Command
from aiogram.client.session.aiohttp import AiohttpSession
import aiohttp
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- 1. ЗАГРУЗКА КЛЮЧЕЙ ---
current_dir = Path(__file__).parent
load_dotenv(dotenv_path=current_dir / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN")
PAYMENT_TOKEN = os.getenv("PAYMENT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
PROXY_URL = os.getenv("PROXY_URL") # Optional: e.g., http://user:pass@host:port
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# --- 2. КЛАВИАТУРЫ ---
def get_main_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 Личный кабинет", callback_data="main_lk")],
        [InlineKeyboardButton(text="💎 Оформить подписку", callback_data="main_sub")],
        [InlineKeyboardButton(text="🆘 Поддержка", url="https://t.me/Self_Career")],
        [InlineKeyboardButton(text="📢 ТГ канал", url="https://t.me/NutriSnap_App")]
    ])

def get_sub_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Купить за 199р", callback_data="pay_199")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="back_main")]
    ])

async def main():
    # Настройка сессии (с прокси, если указан)
    session = None
    if PROXY_URL:
        logger.info(f"Attempting to use proxy: {PROXY_URL}")
        session = AiohttpSession(proxy=PROXY_URL)
    
    bot = Bot(token=BOT_TOKEN, session=session)
    dp = Dispatcher()
    
    supabase: Client = None
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    @dp.message(Command("start"))
    async def cmd_start(message: Message):
        welcome_text = (
            "👋 **Привет! Я бот NutriSnap.**\n\n"
            "Я помогу тебе оформить подписку для расширенного анализа еды и получения персональных советов.\n\n"
            "Выбери действие ниже:"
        )
        await message.answer(
            welcome_text,
            reply_markup=get_main_menu(),
            parse_mode="Markdown"
        )

    @dp.callback_query(F.data == "main_sub")
    async def sub_menu(callback: CallbackQuery):
        await callback.message.edit_text("Выберите тариф:", reply_markup=get_sub_menu())

    @dp.callback_query(F.data == "main_lk")
    async def personal_account(callback: CallbackQuery):
        user_id = str(callback.from_user.id)
        if not supabase:
            await callback.answer("Личный кабинет временно недоступен (Supabase не настроен).", show_alert=True)
            return
            
        try:
            # Check if user has any active codes or used codes
            # Note: We use 'subscription_keys' table as in the web app
            # We assume there might be a 'used_by' column or similar if we want to track it
            # For now, we'll just show a generic message or check if they have a code
            res = supabase.table("subscription_keys").select("*").eq("used_by", user_id).execute()
            
            if res.data:
                count = len(res.data)
                text = f"👤 **Личный кабинет**\n\nID: `{user_id}`\nКуплено подписок: {count}\n\nСтатус: ✅ Активен"
            else:
                text = f"👤 **Личный кабинет**\n\nID: `{user_id}`\nСтатус: ❌ Подписка не найдена"
                
            await callback.message.edit_text(text, reply_markup=get_main_menu(), parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Supabase LK Error: {e}")
            await callback.answer("Ошибка при получении данных из базы.", show_alert=True)

    # --- ОПЛАТА ---
    @dp.callback_query(F.data == "pay_199")
    async def do_payment(callback: CallbackQuery):
        if not PAYMENT_TOKEN:
            await callback.answer("Ошибка: Платежи не настроены (PAYMENT_TOKEN отсутствует).", show_alert=True)
            return

        try:
            await bot.send_invoice(
                chat_id=callback.message.chat.id,
                title="Подписка NutriSnap Pro (1 месяц)",
                description="Доступ ко всем функциям приложения на 30 дней",
                payload="sub_1_month",
                provider_token=PAYMENT_TOKEN,
                currency="RUB",
                prices=[LabeledPrice(label="1 месяц", amount=19900)], # 199.00 RUB
                start_parameter="sub-buy"
            )
            await callback.answer()
        except Exception as e:
            logger.error(f"Invoice Error: {e}")
            await callback.answer("Ошибка при создании счета. Проверьте PAYMENT_TOKEN.", show_alert=True)

    @dp.pre_checkout_query()
    async def pre_checkout(query: PreCheckoutQuery):
        await bot.answer_pre_checkout_query(query.id, ok=True)

    @dp.message(F.successful_payment)
    async def success_pay(message: Message):
        # Вызываем API нашего приложения для генерации кода
        # Используем прокси для API вызова если он нужен
        proxy = PROXY_URL if PROXY_URL else None
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{API_BASE_URL}/api/subscription/generate",
                    json={"secret_key": INTERNAL_API_KEY, "days": 30},
                    proxy=proxy
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        code = data.get("code")
                        
                        # Optionally update the code in Supabase with the user's ID
                        if supabase:
                            try:
                                supabase.table("subscription_keys").update({"used_by": str(message.from_user.id)}).eq("code", code).execute()
                            except:
                                pass
                                
                        await message.answer(
                            f"🎉 **Оплата прошла успешно!**\n\n"
                            f"Твой код активации: ` {code} `\n\n"
                            f"Введи его в приложении NutriSnap в разделе профиля.\n\n"
                            f"🔗 [Открыть приложение]({API_BASE_URL})",
                            parse_mode="Markdown"
                        )
                    else:
                        await message.answer("❌ Ошибка при генерации кода. Обратитесь в поддержку @Self_Career")
            except Exception as e:
                logger.error(f"API Error: {e}")
                await message.answer("❌ Ошибка связи с сервером. Обратитесь в поддержку @Self_Career")

    @dp.callback_query(F.data == "back_main")
    async def back_to_main(callback: CallbackQuery):
        await callback.message.edit_text("Выберите действие:", reply_markup=get_main_menu())

    logger.info("🚀 Бот запускается...")
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Polling Error: {e}")

if __name__ == "__main__":
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN not found in .env file")
    else:
        asyncio.run(main())
