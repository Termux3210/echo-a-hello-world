
import { supabase } from "./supabaseClient";
import { sendDeliveryReminder } from "./telegramWebAppIntegration";

/**
 * Start the delivery reminder system
 * Runs checks daily to send reminders to users about upcoming deliveries
 */
export const startDeliveryReminderSystem = async () => {
  console.log("Starting delivery reminder system...");
  
  // Initial check when the system starts
  await checkAndSendReminders();
  
  // Schedule daily checks
  // Run every 24 hours
  setInterval(checkAndSendReminders, 24 * 60 * 60 * 1000);
};

/**
 * Check for upcoming deliveries and send reminders
 */
const checkAndSendReminders = async () => {
  try {
    console.log("Checking for upcoming deliveries to send reminders...");
    
    // Get current date
    const now = new Date();
    
    // Get orders with future delivery dates
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, 
        delivery_date, 
        telegram_user_id, 
        telegram_username,
        status,
        residential_complex_id,
        residential_complexes(name)
      `)
      .in('status', ['pending', 'processing'])
      .gte('delivery_date', now.toISOString().split('T')[0]);
    
    if (error) {
      console.error("Error fetching orders for reminders:", error);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log("No upcoming deliveries found for reminders");
      return;
    }
    
    console.log(`Found ${orders.length} upcoming deliveries for reminder check`);
    
    // Process each order
    for (const order of orders) {
      await processOrderReminder(order);
    }
    
    console.log("Reminder check completed");
  } catch (error) {
    console.error("Error in reminder system:", error);
  }
};

/**
 * Process a single order for reminders
 */
const processOrderReminder = async (order) => {
  try {
    // Calculate days until delivery
    const deliveryDate = new Date(order.delivery_date);
    const now = new Date();
    
    // Reset time portion to compare just the dates
    now.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = deliveryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format date for display
    const formattedDate = deliveryDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // Get complex name
    const complexName = order.residential_complexes?.name || "Ваш ЖК";
    
    // Determine if we should send reminder based on days remaining
    // Send reminders 3 days before, 2 days before, 1 day before, and on the day of delivery
    if (diffDays <= 3 && diffDays >= 0) {
      console.log(`Sending reminder for order #${order.id}, delivery in ${diffDays} days`);
      
      // Use telegram_user_id if available, otherwise use username
      const userId = order.telegram_user_id || order.telegram_username;
      
      if (!userId) {
        console.log(`No user ID or username for order #${order.id}, skipping reminder`);
        return; // Changed from 'continue' to 'return' since we're not in a loop context
      }
      
      // Send reminder
      await sendDeliveryReminder(
        userId,
        order.id,
        formattedDate,
        complexName
      );
      
      console.log(`Reminder sent for order #${order.id}`);
    }
  } catch (error) {
    console.error(`Error processing reminder for order #${order.id}:`, error);
  }
};
