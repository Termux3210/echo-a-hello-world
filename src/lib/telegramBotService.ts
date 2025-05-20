
import { TELEGRAM_BOT_TOKEN, sendTelegramMessage } from './telegramConfig';
import { getCurrentTelegramUserId } from './telegramWebAppIntegration';

/**
 * This is a client-side representation of the Telegram bot functionality.
 * The actual bot runs on a server using the provided Node.js code.
 */

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

/**
 * Send order status notification to a user
 * Note: In a real application, this would call a backend API that would use the bot to send the notification
 */
export async function sendOrderStatusNotification(userId: number, orderId: number, newStatus: string): Promise<boolean> {
  console.log(`[Client] Sending notification to user ${userId} about order #${orderId} status: ${newStatus}`);
  
  try {
    // In a real implementation, you would call an API endpoint
    // that would trigger the bot to send a message
    const message = `🔔 Обновление статуса заказа #${orderId}: ${newStatus}`;
    
    // This is for demo purposes - in production you'd use a secure API endpoint
    await sendTelegramMessage(userId, message, {
      parseMode: "HTML",
    });
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Check if a user exists in the Telegram database
 */
export async function checkUserExists(userId: number): Promise<boolean> {
  console.log(`[Client] Checking if user ${userId} exists`);
  
  try {
    // In a real implementation, you would call an API endpoint
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check user');
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking user:', error);
    return false;
  }
}

/**
 * Get the Telegram bot token
 * Useful for debugging and checking the configuration
 */
export function getTelegramBotToken(): string {
  return TELEGRAM_BOT_TOKEN;
}

/**
 * Get the current user's Telegram ID
 * Returns the current user's Telegram ID or null if not available
 */
export function getCurrentUserTelegramId(): number | null {
  return getCurrentTelegramUserId();
}

/**
 * Create a Node.js server script for running the Telegram bot
 * This is for demonstration purposes only
 */
export const getTelegramBotServerCode = (): string => {
  return `
// Node.js Telegram Bot Server Example
// Save this as telegram-bot-server.js and run with 'node telegram-bot-server.js'

const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const token = '${TELEGRAM_BOT_TOKEN}';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Start command handler
bot.onText(/\\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Добро пожаловать! Я бот для уведомлений о статусе заказов.');
  
  // You can store the user in your database here
  console.log('New user started the bot:', {
    id: msg.from.id,
    username: msg.from.username,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name
  });
});

// Handle messages
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Получил ваше сообщение! Я отправлю вам уведомление, когда статус вашего заказа изменится.');
  }
});

// Handle callbacks (e.g., from inline buttons)
bot.on('callback_query', (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  
  bot.answerCallbackQuery(callbackQuery.id)
    .then(() => {
      bot.sendMessage(chatId, \`Вы выбрали действие: \${action}\`);
    });
});

console.log('Telegram bot server is running...');
  `;
};

/**
 * Create a sample webhook handler for Telegram updates
 * This is for demonstration purposes only
 */
export const getTelegramWebhookHandlerCode = (): string => {
  return `
// Express.js Webhook Handler Example
// Save this as telegram-webhook.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Webhook endpoint
app.post('/webhook/telegram', (req, res) => {
  const update = req.body;
  
  // Process update
  console.log('Received update from Telegram:', update);
  
  // Handle message
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    // Process message
    console.log(\`Message from \${chatId}: \${text}\`);
    
    // Here you would call your bot's API to send a response
  }
  
  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Webhook server is running on port \${PORT}\`);
});
  `;
};
