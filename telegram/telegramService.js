const axios = require('axios');
const env = require('../config/env');

async function sendTelegramMessage(text) {
  if (!env.telegram.botToken || !env.telegram.chatId) {
    return {
      sent: false,
      skipped: true,
    };
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`,
      {
        chat_id: env.telegram.chatId,
        text,
      },
      {
        timeout: 5000,
      }
    );

    return {
      sent: true,
      skipped: false,
    };
  } catch (error) {
    console.error(`Error Telegram: ${error.message}`);

    return {
      sent: false,
      skipped: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendTelegramMessage,
};