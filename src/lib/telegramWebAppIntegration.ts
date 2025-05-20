import { getTelegramUser } from '@/lib/telegramWebApp';
import { sendTelegramMessage } from '@/lib/telegramConfig';
import { supabase } from '@/lib/supabaseClient';

/**
 * Utility functions for deeper integration with Telegram bot and WebApp
 */

/**
 * Get the current Telegram user ID, either from WebApp or from local storage
 */
export const getCurrentTelegramUserId = (): number | null => {
  try {
    // First try to get from Telegram WebApp
    const telegramUser = getTelegramUser();
    if (telegramUser?.id) {
      console.log(`Got Telegram user ID from WebApp: ${telegramUser.id}`);
      return telegramUser.id;
    }
    
    // If not available, try to get from localStorage
    const savedUserId = localStorage.getItem('telegramUserId');
    if (savedUserId) {
      console.log(`Got Telegram user ID from localStorage: ${savedUserId}`);
      return parseInt(savedUserId, 10);
    }
    
    console.log("Could not find Telegram user ID");
    return null;
  } catch (error) {
    console.error("Error getting Telegram user ID:", error);
    return null;
  }
};

/**
 * Save Telegram user ID to localStorage for future reference
 */
export const saveTelegramUserId = (userId: number): void => {
  try {
    localStorage.setItem('telegramUserId', userId.toString());
    console.log(`Saved Telegram user ID to localStorage: ${userId}`);
  } catch (error) {
    console.error("Error saving Telegram user ID to localStorage:", error);
  }
};

/**
 * Register a new user from Telegram in the database
 */
export const registerTelegramUser = async (
  userId: number,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<boolean> => {
  try {
    console.log(`Registering Telegram user: ID=${userId}, username=${username}, name=${firstName} ${lastName}`);
    
    // Format username with @ prefix if available
    const formattedUsername = username ? 
      (username.startsWith('@') ? username : `@${username}`) : 
      null;
    
    // Check if user already exists
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_username', formattedUsername || `@user_${userId}`)
      .maybeSingle();
    
    if (queryError && queryError.code !== 'PGRST116') {
      console.error("Error checking for existing user:", queryError);
      return false;
    }
    
    if (existingUser) {
      console.log("User already exists, no need to register");
      return true;
    }
    
    // Insert new user
    const { error } = await supabase
      .from('users')
      .insert({
        telegram_username: formattedUsername || `@user_${userId}`,
        name: [firstName, lastName].filter(Boolean).join(' ') || `User ${userId}`,
        is_admin: false,
      });
    
    if (error) {
      console.error("Error registering user:", error);
      return false;
    }
    
    console.log("User registered successfully");
    return true;
  } catch (error) {
    console.error('Error registering Telegram user:', error);
    return false;
  }
};

/**
 * Send notification to user about their order
 */
export const notifyUserAboutOrder = async (
  userId: number | string,
  orderId: number,
  status: string,
  details?: {
    products?: string;
    deliveryDate?: string;
    complex?: string;
    address?: string;
  }
): Promise<boolean> => {
  try {
    if (!userId) {
      console.warn("Cannot send notification: No user ID provided");
      return false;
    }

    console.log(`Attempting to send notification to user ${userId} for order #${orderId}`);

    let message = `🔔 <b>Заказ #${orderId}</b>\n\n`;

    switch (status) {
      case "pending":
        message += "✨ Заказ успешн�� создан и ожидает обработки!\n\n";
        break;
      case "processing":
        message += "🔄 Заказ в обработке\n\n";
        break;
      case "delivering":
        message += "🚚 Заказ готовится к доставке\n\n";
        break;
      case "completed":
        message += "✅ Заказ успешно доставлен\n\n";
        break;
      case "cancelled":
        message += "❌ Заказ отменен\n\n";
        break;
      case "reminder":
        message += "🔔 <b>Напоминание о предстоящей доставке!</b>\n\n";
        break;
    }

    if (details) {
      if (details.products) {
        message += `📦 <b>Товары:</b>\n${details.products}\n\n`;
      }
      if (details.deliveryDate) {
        message += `📅 <b>Дата доставки:</b> ${details.deliveryDate}\n`;
      }
      if (details.complex) {
        message += `🏘️ <b>ЖК:</b> ${details.complex}\n`;
      }
      if (details.address) {
        message += `📍 <b>Адрес:</b> ${details.address}\n`;
      }
    }

    // For reminders, add an extra message
    if (status === "reminder") {
      const daysText = details?.deliveryDate ? 
        `Ваш заказ будет доставлен: ${details.deliveryDate}` : 
        "Скоро состоится доставка вашего заказа";
      
      message += `\n⏰ <b>${daysText}</b>\n`;
      message += "Пожалуйста, убедитесь, что вы будете доступны в указанную дату.";
    }

    // Debug logging
    console.log("Sending notification with message:", message.substring(0, 100) + "...");
    console.log("Notification recipient:", userId);

    // Проверяем тип userId - строка или число
    console.log(`User ID type: ${typeof userId}, value: ${userId}`);

    // Подготовка к отправке - проверка, является ли значение числовым
    let targetUserId = userId;
    if (typeof userId === 'string') {
      // Если userId - строка, но может быть преобразована в число
      if (!isNaN(Number(userId)) && !userId.startsWith('@')) {
        targetUserId = Number(userId);
        console.log(`Converted string user ID to number: ${targetUserId}`);
      }
    }

    // Отправка уведомления
    try {
      // Direct Telegram API method
      console.log(`Sending notification to ${targetUserId} using direct Telegram API`);
      const result = await sendTelegramMessage(targetUserId, message, {
        parseMode: "HTML",
      });
      
      console.log("Notification sent successfully:", result);
      return true;
    } catch (apiError: any) {
      console.error(`Failed to send notification via Telegram API to ${targetUserId}:`, apiError);
      console.error("Error details:", apiError.message);
      
      // Try alternative message format
      try {
        // Try sending plain text without HTML formatting
        const plainMessage = message
          .replace(/<b>/g, '')
          .replace(/<\/b>/g, '');
          
        await sendTelegramMessage(targetUserId, plainMessage);
        console.log("Sent plain text notification as fallback");
        return true;
      } catch (plainError) {
        console.error("Failed to send plain text notification:", plainError);
        
        // Last resort, try sending via bot API directly with a different approach
        try {
          const botToken = "7771643973:AAGwXlvLZ0LnY5cGYFB83qx7je69Bkh_78o";
          const chatId = targetUserId.toString();
            
          // Create a plain text version of the message
          const plainTextMessage = message
            .replace(/<b>/g, '')
            .replace(/<\/b>/g, '');
            
          console.log(`Last resort: Sending direct API call to chat_id: ${chatId}`);
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: plainTextMessage
            })
          });
          
          const result = await response.json();
          console.log("Direct API call result:", result);
          
          if (result.ok) {
            return true;
          } else {
            console.error("Direct API call failed:", result.description);
            return false;
          }
        } catch (directError) {
          console.error("All notification methods failed:", directError);
          return false;
        }
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Send delivery reminder to user
 */
export const sendDeliveryReminder = async (
  userId: number | string,
  orderId: number,
  deliveryDate: string,
  complex: string
): Promise<boolean> => {
  try {
    if (!userId) {
      console.warn("Cannot send delivery reminder: No user ID provided");
      return false;
    }

    console.log(`Attempting to send delivery reminder to user ${userId} for order #${orderId}`);

    return await notifyUserAboutOrder(userId, orderId, 'reminder', {
      deliveryDate,
      complex
    });
  } catch (error) {
    console.error('Error sending delivery reminder:', error);
    return false;
  }
};

/**
 * Sync user info from Telegram WebApp with database
 */
export const syncTelegramUserInfo = async (): Promise<boolean> => {
  try {
    const telegramUser = getTelegramUser();
    
    if (!telegramUser?.id) {
      console.log("No Telegram user information available to sync");
      return false;
    }
    
    console.log("Syncing Telegram user info:", telegramUser);
    
    const result = await registerTelegramUser(
      telegramUser.id,
      telegramUser.username,
      telegramUser.first_name,
      telegramUser.last_name
    );
    
    if (result) {
      // Сохраняем ID для будущего использования
      saveTelegramUserId(telegramUser.id);
    }
    
    return result;
  } catch (error) {
    console.error('Error syncing Telegram user info:', error);
    return false;
  }
};

// Add this new function to support sending custom messages
export async function notifyUserWithCustomMessage(
  userId: string | number,
  orderId: number,
  message: string
) {
  try {
    console.log(`Sending custom notification to user ${userId} about order #${orderId}`);
    
    // Format message with order ID if not already included
    let formattedMessage = message;
    if (!formattedMessage.includes(`#${orderId}`)) {
      formattedMessage = `📋 Заказ #${orderId}\n\n${message}`;
    }
    
    const result = await sendTelegramMessage(userId, formattedMessage, {
      parseMode: "HTML",
    });
    
    return { success: true, result };
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return { success: false, error };
  }
}
