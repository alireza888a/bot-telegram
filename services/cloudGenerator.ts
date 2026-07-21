/**
 * 🤖 Cloud Worker Code Generator Service
 * Generates a lightweight Relay Cloudflare Worker that forwards all Telegram webhooks
 * and scheduled cron events to the central backend server.
 */

export const generateWorkerCode = (token: string, licenseCode: string): string => {
    return `/**
 * 🤖 این کد توسط پنل مدیریت شما تولید شده است.
 * راهنمای نصب:
 * ۱. این کد را کامل کپی کنید.
 * ۲. وارد Cloudflare Dashboard شوید → Workers & Pages → Create Worker.
 * ۳. روی Edit code بزنید، کد فعلی را پاک کنید، این کد را پیست کنید، Deploy بزنید.
 * ۴. اگر پیام زمان‌بندی‌شده استفاده می‌کنید: در تب Settings → Trigger Events → Add → Cron Trigger، زمان‌بندی کرون هر ۵ دقیقه (مثلاً با الگوی * / 5 * * * *) را اضافه کنید.
 * ۵. آدرس Worker (چیزی شبیه https://xxx.workers.dev) را کپی کنید.
 * ۶. در سایت تلگرام یا با ارسال این آدرس به @BotFather webhook خود را تنظیم کنید — یا اگر پنل این کار را برایتان انجام می‌دهد، نیازی به این مرحله نیست.
 * این نسخه یک رلهی سبک است؛ منطق واقعی روی سرور مرکزی اجرا میشود و هیچوقت نیازی به آپدیت این فایل نیست، مگر تغییر لایسنس یا توکن.
 */

const LICENSE_CODE = "${licenseCode}";
const RELAY_API = "https://corepanel-api.tajikr450.workers.dev/api/bot/relay";
const SCHEDULED_API = "https://corepanel-api.tajikr450.workers.dev/api/bot/relay-scheduled";

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const update = await request.json();
        await fetch(RELAY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: LICENSE_CODE,
            update
          })
        });
      } catch (e) {
        console.error("Relay error:", e);
      }
      return new Response("OK");
    }
    return new Response("Bot Relay Worker is active 🚀");
  },

  async scheduled(event, env, ctx) {
    try {
      await fetch(SCHEDULED_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: LICENSE_CODE
        })
      });
    } catch (e) {
      console.error("Scheduled relay error:", e);
    }
  }
};
`;
};
