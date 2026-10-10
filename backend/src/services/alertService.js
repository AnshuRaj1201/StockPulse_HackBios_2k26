// StockPulse Alert Service (Telegram, SMTP & In-App notification buffer)
const inMemoryAlerts = [];

async function triggerAlert({ type, title, message, severity = "HIGH", itemId = null }) {
  const alertEvent = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type, // "LOW_STOCK", "EXPIRY_WARNING", "STOCKOUT", "REORDER_SUGGESTED"
    title,
    message,
    severity, // "CRITICAL", "HIGH", "MEDIUM", "INFO"
    itemId,
    timestamp: new Date().toISOString(),
    read: false
  };

  inMemoryAlerts.unshift(alertEvent);
  if (inMemoryAlerts.length > 100) inMemoryAlerts.pop();

  console.log(`[ALERT TRIGGERED] [${severity}] ${title}: ${message}`);

  // Telegram Integration (if token is configured)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const text = encodeURIComponent(`🚨 *StockPulse Alert* [${severity}]\n*${title}*\n${message}`);
      const url = `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChatId}&text=${text}&parse_mode=Markdown`;
      fetch(url).catch((err) => console.warn("Telegram alert failed:", err.message));
    } catch (e) {
      console.warn("Telegram dispatch error:", e.message);
    }
  }

  return alertEvent;
}

function getRecentAlerts() {
  return inMemoryAlerts;
}

function markAlertRead(id) {
  const alert = inMemoryAlerts.find((a) => a.id === id);
  if (alert) alert.read = true;
  return alert;
}

module.exports = { triggerAlert, getRecentAlerts, markAlertRead };
