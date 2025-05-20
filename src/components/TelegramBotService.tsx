
import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTelegramUser, isTelegramWebApp } from "@/lib/telegramWebApp";
import { useParams } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { registerTelegramUser, saveTelegramUserId } from "@/lib/telegramWebAppIntegration";

interface TelegramBotServiceProps {
  children: ReactNode;
}

const TelegramBotService = ({ children }: TelegramBotServiceProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { isAdmin } = useAdmin();
  const [initialized, setInitialized] = useState(false);
  
  // Handle user from Telegram URL parameter
  useEffect(() => {
    // Only run this effect once
    if (initialized) return;
    
    const processTelegramUser = async () => {
      // Check if we're coming from a Telegram start link with user ID
      if (location.pathname.includes('/start_from_telegram/') && userId) {
        // Save Telegram ID to local storage for future reference
        try {
          // Parse userId as number
          const telegramId = parseInt(userId, 10);
          
          if (!isNaN(telegramId)) {
            console.log(`Telegram user ID received: ${telegramId}`);
            
            // Save the Telegram user ID for future reference
            saveTelegramUserId(telegramId);
            
            // Try to register the user in our system (basic registration)
            await registerTelegramUser(telegramId);
            
            // Redirect to the main page after processing
            if (location.pathname !== '/') {
              navigate('/', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error processing Telegram start parameter:", error);
        }
      }
      
      // Also check for Telegram WebApp user
      if (isTelegramWebApp()) {
        console.log("Running in Telegram WebApp environment");
        const telegramUser = getTelegramUser();
        console.log("Telegram user:", telegramUser);
        
        if (telegramUser?.id) {
          // Save Telegram ID
          saveTelegramUserId(telegramUser.id);
          
          // Register user if coming from Telegram
          try {
            await registerTelegramUser(
              telegramUser.id,
              telegramUser.username,
              telegramUser.first_name,
              telegramUser.last_name
            );
          } catch (error) {
            console.error("Error registering Telegram user:", error);
          }
        }
      }
      
      setInitialized(true);
    };
    
    processTelegramUser();
    
    // Cleanup function
    return () => {
      // No cleanup needed, but providing empty function for consistency
    };
  }, [userId, navigate, location.pathname, initialized, isAdmin]);
  
  return <>{children}</>;
};

export default TelegramBotService;
