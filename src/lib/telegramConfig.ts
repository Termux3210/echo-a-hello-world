
/**
 * Telegram bot configuration and utilities
 */

// Telegram bot token from environment variable
export const TELEGRAM_BOT_TOKEN = "7771643973:AAGwXlvLZ0LnY5cGYFB83qx7je69Bkh_78o";

// Bot username - set this to your bot's username
export const TELEGRAM_BOT_USERNAME = "berry_farm_bot";

// Base URL for Telegram Bot API
export const TELEGRAM_API_URL = "https://api.telegram.org";

// URL для webhook API бота (используется для отправки уведомлений)
export const WEBHOOK_API_URL = import.meta.env.VITE_TELEGRAM_BOT_WEBHOOK || "http://localhost:3000";

/**
 * Generate a deep link to the Telegram bot
 * @param startParam Optional start parameter to pass to the bot
 * @returns URL to open the bot in Telegram
 */
export function getTelegramBotLink(startParam?: string): string {
  const baseUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}`;
  return startParam ? `${baseUrl}?start=${startParam}` : baseUrl;
}

/**
 * Generate a WebApp link for the Telegram bot
 * @param webAppUrl URL for the WebApp
 * @returns URL to open the WebApp in Telegram
 */
export function getTelegramWebAppLink(webAppUrl?: string): string {
  const baseUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}/app`;
  return webAppUrl ? `${baseUrl}?startapp=${encodeURIComponent(webAppUrl)}` : baseUrl;
}

/**
 * Send a message to the Telegram bot API directly
 * @param method API method to call
 * @param params Parameters to send
 * @returns Promise with the API response
 */
export async function sendTelegramApiRequest(method: string, params: any): Promise<any> {
  try {
    const url = `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    console.log(`Sending request to ${url}`, params);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error (${response.status}): ${errorText}`);
      throw new Error(`Telegram API error: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Telegram API response:", result);
    return result;
  } catch (error) {
    console.error("Error calling Telegram API:", error);
    throw error;
  }
}

/**
 * Send a message to a specific user via the Telegram bot
 * @param chatId Telegram chat ID to send the message to
 * @param text Message text
 * @param options Additional options for the message
 * @returns Promise with the API response
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: {
    parseMode?: "HTML" | "MarkdownV2" | "Markdown";
    disableNotification?: boolean;
    replyToMessageId?: number;
    inlineKeyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  }
): Promise<any> {
  console.log(`Sending message to user ${chatId}: ${text.substring(0, 50)}...`);
  
  // Try webhook API first
  try {
    console.log(`Attempting to send via webhook API: ${WEBHOOK_API_URL}/api/notify`);
    const webhookResponse = await fetch(`${WEBHOOK_API_URL}/api/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: chatId,
        message: text,
        parseMode: options?.parseMode
      }),
    });
    
    if (webhookResponse.ok) {
      const result = await webhookResponse.json();
      console.log("Message sent via webhook API:", result);
      return result;
    }
    
    console.warn("Webhook API failed, status:", webhookResponse.status);
    const webhookErrorText = await webhookResponse.text();
    console.warn("Webhook API error details:", webhookErrorText);
    console.warn("Falling back to direct API");
  } catch (webhookError) {
    console.warn("Error using webhook API:", webhookError);
    console.warn("Falling back to direct API");
  }
  
  // Fallback to direct Telegram API
  const params: any = {
    chat_id: chatId,
    text: text,
  };
  
  if (options?.parseMode) {
    params.parse_mode = options.parseMode;
  }
  
  if (options?.disableNotification) {
    params.disable_notification = options.disableNotification;
  }
  
  if (options?.replyToMessageId) {
    params.reply_to_message_id = options.replyToMessageId;
  }
  
  if (options?.inlineKeyboard) {
    params.reply_markup = {
      inline_keyboard: options.inlineKeyboard,
    };
  }
  
  try {
    // Попытка отправить сообщение напрямую
    return await sendTelegramApiRequest("sendMessage", params);
  } catch (directApiError) {
    console.error("Failed to send message via direct API:", directApiError);

    // Попробуем обработать случай, когда предоставлен username вместо userId
    if (typeof chatId === 'string' && chatId.startsWith('@')) {
      try {
        // Если есть webhook API, проверим, можем ли мы найти пользователя по username
        console.log("Attempting to find user by username via webhook:", chatId);
        const userResponse = await fetch(`${WEBHOOK_API_URL}/api/user-by-username/${chatId.substring(1)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (userResponse.ok) {
          const userInfo = await userResponse.json();
          if (userInfo.exists && userInfo.user?.id) {
            console.log(`Found user ID for ${chatId}: ${userInfo.user.id}`);
            // Попробуем отправить сообщение по ID пользователя
            const newParams = { ...params, chat_id: userInfo.user.id };
            return await sendTelegramApiRequest("sendMessage", newParams);
          }
        }
      } catch (usernameError) {
        console.error("Error finding user by username:", usernameError);
      }
    }
    
    throw directApiError;
  }
}
