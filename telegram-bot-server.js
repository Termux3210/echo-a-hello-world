
/**
 * Telegram Bot Server
 * 
 * This is a standalone Node.js server that implements the Telegram bot
 * for the farm products website. Run this server separately from your
 * main website application.
 * 
 * Installation:
 * 1. npm install node-telegram-bot-api express body-parser dotenv
 * 2. node telegram-bot-server.js
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Bot configuration
const token = process.env.TELEGRAM_BOT_TOKEN || '7771643973:AAGwXlvLZ0LnY5cGYFB83qx7je69Bkh_78o';
// Replace with your actual web app URL
const webAppUrl = process.env.WEB_APP_URL || 'https://your-app-url.com';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Express app for webhook and API
const app = express();
app.use(bodyParser.json());

// Enable CORS for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Store user data - this would be replaced with a database in production
const users = new Map();
const USERS_FILE = path.join(__dirname, 'telegram_users.json');

// Load existing users from file if it exists
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const loadedUsers = JSON.parse(data);
      
      // Convert the array back to a Map
      loadedUsers.forEach(user => {
        users.set(user.userId.toString(), user);
      });
      
      console.log(`Loaded ${loadedUsers.length} users from storage`);
    }
  } catch (error) {
    console.error('Error loading users from file:', error);
  }
}

// Save users to file
function saveUsers() {
  try {
    // Convert Map to array for JSON serialization
    const usersArray = Array.from(users.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
    console.log(`Saved ${usersArray.length} users to storage`);
  } catch (error) {
    console.error('Error saving users to file:', error);
  }
}

// Load existing users at startup
loadUsers();

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  console.log(`User started bot - ID: ${userId}, Username: @${username}, Name: ${firstName} ${lastName}`);
  
  // Save user data with more details
  const userData = {
    userId: userId,
    chatId: chatId,
    firstName: firstName,
    lastName: lastName,
    username: username ? (username.startsWith('@') ? username : `@${username}`) : '',
    registeredAt: new Date().toISOString()
  };
  
  users.set(userId.toString(), userData);
  
  // Save users to persistent storage
  saveUsers();
  
  // Create inline keyboard with WebApp button
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: '🛒 Открыть магазин', web_app: { url: webAppUrl } }]
    ]
  };
  
  bot.sendMessage(chatId, 
    `Привет, ${firstName}! Я бот для магазина фермерских продуктов.\n\nВаш Telegram ID: <code>${userId}</code>\n\nЭтот ID будет автоматически использован при оформлении заказа для отправки уведомлений.\n\nНажмите на кнопку ниже, чтобы открыть магазин:`, 
    { 
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard 
    }
  );
  
  console.log('New user started the bot:', {
    id: userId,
    username: username || 'не указан',
    name: `${firstName} ${lastName}`.trim()
  });
});

// Command to show WebApp again
bot.onText(/\/shop/, (msg) => {
  const chatId = msg.chat.id;
  
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: '🛒 Открыть магазин', web_app: { url: webAppUrl } }]
    ]
  };
  
  bot.sendMessage(chatId, 
    'Нажмите на кнопку ниже, чтобы открыть магазин:', 
    { reply_markup: inlineKeyboard }
  );
});

// Command to get user ID
bot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  bot.sendMessage(chatId, 
    `Ваш Telegram ID: <code>${userId}</code>\n\nЭтот ID будет автоматически использован при оформлении заказа для получения уведомлений.`, 
    { parse_mode: 'HTML' }
  );
});

// Handle regular messages
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    
    // Check if the message is JSON data from the web app
    try {
      const data = JSON.parse(msg.text);
      
      if (data.action === 'message' && data.data) {
        // The outer message is our wrapper, try to parse the inner message
        try {
          const innerData = JSON.parse(data.data);
          
          if (innerData.message) {
            console.log('Received structured data from web app:', innerData);
            bot.sendMessage(chatId, `Получил ваше сообщение из веб-приложения: "${innerData.message}"`);
            
            if (innerData.userId) {
              console.log(`Message associated with user ID: ${innerData.userId}`);
            }
            
            return;
          }
        } catch (e) {
          // Inner content not JSON, handle as regular message
          console.log('Received simple data from web app:', data.data);
          bot.sendMessage(chatId, `Получил ваше сообщение из веб-приложения: "${data.data}"`);
          return;
        }
      }
    } catch (e) {
      // Not JSON, handle as regular message
    }
    
    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: '🛒 Открыть магазин', web_app: { url: webAppUrl } }]
      ]
    };
    
    bot.sendMessage(chatId, 
      'Спасибо за ваше сообщение! Вы можете открыть наш магазин, нажав на кнопку ниже:', 
      { reply_markup: inlineKeyboard }
    );
  }
});

// Webhook route (optional)
app.post(`/webhook/${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// API to send notifications to users
app.post('/api/notify', async (req, res) => {
  console.log('Received notification request:', req.body);
  
  const { userId, chatId, message, parseMode } = req.body;
  
  if ((!userId && !chatId) || !message) {
    console.error('Missing required parameters:', { userId, chatId, message });
    return res.status(400).json({ error: 'User ID/Chat ID and message are required' });
  }
  
  let targetChatId = chatId;
  
  // If we have userId but not chatId, try to find the user
  if (userId && !chatId) {
    console.log(`Looking for user with ID: ${userId}`);
    
    // Проверяем тип userId - строка или число
    console.log(`User ID type: ${typeof userId}`);
    
    let userIdStr = userId.toString();
    
    // Если userId - это username (начинается с @), ищем пользователя по username
    if (typeof userId === 'string' && userId.startsWith('@')) {
      console.log(`Looking for user by username: ${userId}`);
      // Ищем пользователя по username (без @)
      const username = userId.substring(1);
      
      let foundUser = null;
      for (const user of users.values()) {
        const userUsername = user.username?.startsWith('@') 
          ? user.username.substring(1) 
          : user.username;
        
        if (userUsername === username) {
          foundUser = user;
          break;
        }
      }
      
      if (foundUser) {
        targetChatId = foundUser.chatId;
        console.log(`Found user by username: ${foundUser.firstName} ${foundUser.lastName} (Chat ID: ${targetChatId})`);
      } else {
        console.error(`User with username ${userId} not found`);
        return res.status(404).json({ error: `User with username ${userId} not found` });
      }
    } else {
      // Ищем пользователя по ID
      const user = users.get(userIdStr);
      
      if (user) {
        console.log(`Found user in database: ${user.firstName} ${user.lastName} (${user.chatId})`);
        targetChatId = user.chatId;
      } else {
        // Если userId числовое, пробуем отправить напрямую (так как оно может быть chat_id)
        if (!isNaN(Number(userId))) {
          console.log(`User not found in database, using userId as chatId: ${userId}`);
          targetChatId = userId;
        } else {
          console.error(`User with ID ${userId} not found`);
          return res.status(404).json({ error: `User with ID ${userId} not found` });
        }
      }
    }
  }
  
  if (!targetChatId) {
    console.error('Could not determine a target chat ID');
    return res.status(404).json({ error: 'User not found and no chat ID provided' });
  }
  
  const options = {};
  
  if (parseMode) {
    options.parse_mode = parseMode;
  }
  
  console.log(`Sending message to chat ID: ${targetChatId}`);
  console.log(`Message: ${message.substring(0, 100)}...`);
  
  try {
    const result = await bot.sendMessage(targetChatId, message, options);
    console.log('Message sent successfully:', result.message_id);
    res.json({ success: true, message_id: result.message_id });
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Попробуем отправить без HTML-разметки
    if (parseMode === 'HTML') {
      try {
        const plainMessage = message
          .replace(/<b>/g, '')
          .replace(/<\/b>/g, '');
        
        const plainResult = await bot.sendMessage(targetChatId, plainMessage);
        console.log('Plain message sent as fallback:', plainResult.message_id);
        return res.json({ success: true, message_id: plainResult.message_id, note: 'Sent as plain text' });
      } catch (plainError) {
        console.error('Failed to send plain text message:', plainError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to send message', 
      details: error.message, 
      code: error.code, 
      responseParameters: error.response?.parameters
    });
  }
});

// API to check if a user exists
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = users.get(userId.toString());
  
  if (user) {
    res.json({
      exists: true,
      user: {
        id: userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } else {
    res.json({ exists: false });
  }
});

// API to find user by username
app.get('/api/user-by-username/:username', (req, res) => {
  let { username } = req.params;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  // Normalize username (add @ if missing)
  if (!username.startsWith('@')) {
    username = `@${username}`;
  }
  
  // Find user with this username
  let foundUser = null;
  for (const user of users.values()) {
    if (user.username === username) {
      foundUser = user;
      break;
    }
  }
  
  if (foundUser) {
    res.json({
      exists: true,
      user: {
        id: foundUser.userId,
        username: foundUser.username,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName
      }
    });
  } else {
    res.json({ exists: false });
  }
});

// API to get all users
app.get('/api/users', (req, res) => {
  const usersList = Array.from(users.values()).map(user => ({
    id: user.userId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    registeredAt: user.registeredAt
  }));
  
  res.json({ users: usersList });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    users: users.size, 
    bot_info: {
      token_prefix: token.slice(0, 6),
      webhook_url: webAppUrl
    }
  });
});

// Test connection endpoint
app.get('/test-connection/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  try {
    // Try to send a test message
    const result = await bot.sendMessage(
      userId,
      'Тестовое сообщение. Если вы получили это сообщение, значит соединение работает.',
      { parse_mode: 'HTML' }
    );
    
    res.json({ 
      success: true, 
      message: 'Тестовое сообщение отправлено успешно', 
      details: {
        message_id: result.message_id,
        date: result.date
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при отправке тестового сообщения', 
      details: error.message 
    });
  }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
  console.log(`Telegram bot server is running with token: ${token.slice(0, 6)}...`);
  console.log(`WebApp URL: ${webAppUrl}`);
});

// Print out bot info on startup
console.log('Bot commands:');
console.log('/start - Start the bot and get a welcome message with your Telegram ID');
console.log('/shop - Get a button to open the shop');
console.log('/id - Get your Telegram ID for order notifications');

// Log startup success
console.log('Telegram bot server started successfully!');
