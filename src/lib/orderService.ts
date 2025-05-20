
import { supabase } from "@/integrations/supabase/client";
import { notifyUserAboutOrder, sendDeliveryReminder } from "./telegramWebAppIntegration";
import { getCurrentTelegramUserId } from "./telegramWebAppIntegration";
import { fetchSettings } from "./settingsService";
import { toast } from "sonner";

export const createOrder = async (orderData: any) => {
  try {
    console.log("Starting order creation with data:", orderData);
    
    if (!orderData.customer_name || !orderData.phone || !orderData.items || !orderData.residential_complex_id) {
      console.error("Order data validation failed:", orderData);
      return { success: false, error: "Недостаточно данных для создания заказа" };
    }

    // Make sure telegram_username is formatted correctly
    if (orderData.telegram_username && !orderData.telegram_username.startsWith('@')) {
      orderData.telegram_username = `@${orderData.telegram_username}`;
    }

    // Get Telegram user ID if available, but not in orderData
    if (!orderData.telegram_user_id) {
      const telegramUserId = getCurrentTelegramUserId();
      if (telegramUserId) {
        orderData.telegram_user_id = telegramUserId.toString();
        console.log("Added Telegram user ID to order:", telegramUserId);
      }
    }

    // Log important data for debugging
    console.log("Order Telegram data:", {
      username: orderData.telegram_username,
      userId: orderData.telegram_user_id
    });

    // Handle errors gracefully by checking if telegram_user_id column exists
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select('*, residential_complexes(name)').single();

      if (error) {
        console.error("Supabase insert error:", error);
        
        // If telegram_user_id column doesn't exist, retry without it
        if (error.code === '42703' && error.message?.includes('telegram_user_id')) {
          console.log("telegram_user_id column doesn't exist, trying without it");
          const { telegram_user_id, ...dataWithoutTelegramId } = orderData;
          
          const { data: orderWithoutId, error: retryError } = await supabase
            .from('orders')
            .insert([dataWithoutTelegramId])
            .select('*, residential_complexes(name)').single();
            
          if (retryError) {
            console.error("Retry insert error:", retryError);
            throw retryError;
          }
          
          // Use the order without Telegram ID
          if (orderWithoutId) {
            await sendOrderNotification(orderWithoutId);
            return { success: true, data: orderWithoutId };
          }
        } else {
          throw error;
        }
      }

      if (order) {
        await sendOrderNotification(order);
        return { success: true, data: order };
      }
    } catch (insertError) {
      console.error("Error during order insertion:", insertError);
      
      // Last attempt - try with minimal required fields
      try {
        const minimalOrderData = {
          customer_name: orderData.customer_name,
          phone: orderData.phone,
          telegram_username: orderData.telegram_username,
          telegram_user_id: orderData.telegram_user_id,  // Сохраняем telegram_user_id
          residential_complex_id: orderData.residential_complex_id,
          items: orderData.items,
          delivery_date: orderData.delivery_date,
          status: 'pending'
        };
        
        const { data: minimalOrder, error: minimalError } = await supabase
          .from('orders')
          .insert([minimalOrderData])
          .select().single();
          
        if (minimalError) {
          console.error("Minimal insert error:", minimalError);
          throw minimalError;
        }
        
        if (minimalOrder) {
          // Get complex name separately
          const { data: complex } = await supabase
            .from('residential_complexes')
            .select('name')
            .eq('id', minimalOrder.residential_complex_id)
            .single();
            
          const orderWithComplex = {
            ...minimalOrder,
            residential_complexes: complex
          };
          
          await sendOrderNotification(orderWithComplex);
          return { success: true, data: orderWithComplex };
        }
      } catch (minimalError) {
        console.error("Minimal order creation failed:", minimalError);
      }
    }

    return { success: false, error: "Не удалось создать заказ" };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }
};

// Helper function to send order notification
async function sendOrderNotification(order: any) {
  try {
    const settings = await fetchSettings();
    
    if (settings.success && 
        settings.data?.enable_notifications && 
        settings.data?.telegram_notifications) {
      
      // Get product details
      const products = await getOrderProducts(order.items);
      const productsList = formatProductsList(products, order.items);
      
      // Format delivery date
      const deliveryDate = order.delivery_date ? 
        new Date(order.delivery_date).toLocaleDateString('ru-RU') : 
        "Не указана";

      // Determine complex name
      let complexName = "Неизвестный ЖК";
      if (order.residential_complexes) {
        if (typeof order.residential_complexes === 'object' && order.residential_complexes !== null) {
          complexName = order.residential_complexes.name || "Неизвестный ЖК";
        }
      }

      // Определяем получателя: сначала пробуем по ID, затем по username
      let recipientId = order.telegram_user_id;
      
      // Log для отладки
      console.log("Order notification recipient data:", {
        telegram_user_id: order.telegram_user_id,
        telegram_username: order.telegram_username
      });
      
      // Если telegram_user_id отсутствует или пуст, используем username
      if (!recipientId) {
        recipientId = order.telegram_username;
        console.log(`Using username as recipient: ${recipientId}`);
      } else {
        console.log(`Using user ID as recipient: ${recipientId}`);
      }
      
      // Send notification
      const notificationResult = await notifyUserAboutOrder(
        recipientId,
        order.id,
        order.status,
        {
          products: productsList,
          deliveryDate: deliveryDate,
          complex: complexName,
          address: order.address
        }
      );
      
      console.log("Notification result:", notificationResult);
    }
  } catch (notificationError) {
    console.error("Failed to send notification but order was created:", notificationError);
  }
}

export const updateOrderStatus = async (orderId: number, status: string, customMessage?: string) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*, residential_complexes(name)')
      .single();
    
    if (error) throw error;
    
    if (order) {
      if (customMessage) {
        // If custom message is provided, use it instead of the default notification
        try {
          const recipientId = order.telegram_user_id || order.telegram_username;
          
          if (recipientId) {
            await sendCustomStatusNotification(recipientId, orderId, customMessage);
          }
        } catch (messageError) {
          console.error("Error sending custom message:", messageError);
        }
      } else {
        // Use default notification
        await sendOrderNotification(order);
      }
      
      return { success: true, data: order };
    }
    
    return { success: false, error: "Не удалось обновить статус заказа" };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }
};

// New function for sending a custom status notification
export const sendCustomStatusNotification = async (recipientId: string | number, orderId: number, message: string) => {
  try {
    const settings = await fetchSettings();
    
    if (settings.success && 
        settings.data?.enable_notifications && 
        settings.data?.telegram_notifications) {
      
      // Import this dynamically to avoid circular dependency
      const { notifyUserWithCustomMessage } = await import("./telegramWebAppIntegration");
      
      return await notifyUserWithCustomMessage(recipientId, orderId, message);
    }
    
    return { success: false, error: "Notifications are disabled" };
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return { success: false, error };
  }
};

// Helper functions
async function getOrderProducts(items: any[]) {
  if (!items || !Array.isArray(items)) return [];
  
  const productIds = items.map(item => item.productId);
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds);
    
  return products || [];
}

function formatProductsList(products: any[], items: any[]) {
  const productMap = new Map(products.map(p => [p.id, p]));
  let totalPrice = 0;
  
  const lines = items.map(item => {
    const product = productMap.get(item.productId);
    if (product) {
      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;
      return `- ${product.name} x ${item.quantity} = ${itemTotal} ₽`;
    }
    return `- Товар ID ${item.productId} x ${item.quantity}`;
  });
  
  return lines.join('\n') + `\n\nИтого: ${totalPrice} ₽`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "В ожидании";
    case "processing": return "В обработке";
    case "delivering": return "Доставляется";
    case "completed": return "Завершен";
    case "cancelled": return "Отменен";
    default: return status;
  }
}
