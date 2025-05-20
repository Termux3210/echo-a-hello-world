
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getTelegramUser, isTelegramWebApp } from '@/lib/telegramWebApp';

interface AdminUser {
  id: number;
  telegram_username: string;
  name: string;
  is_admin: boolean;
}

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  currentUser: AdminUser | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
}

// Create context
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Provider component
export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Check admin status on load
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      // First check if we're in Telegram WebApp and can get user from there
      if (isTelegramWebApp()) {
        const telegramUser = getTelegramUser();
        if (telegramUser && telegramUser.username) {
          const formattedUsername = telegramUser.username.startsWith('@') 
            ? telegramUser.username 
            : `@${telegramUser.username}`;
          
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_username', formattedUsername)
              .eq('is_admin', true)
              .single();
            
            if (error) {
              console.error('Error checking admin status from Telegram:', error);
              setIsAdmin(false);
              setCurrentUser(null);
            } else if (data) {
              // Found admin user in database
              setIsAdmin(true);
              setCurrentUser({
                id: data.id,
                telegram_username: data.telegram_username,
                name: data.name || '',
                is_admin: data.is_admin
              });
              
              // Store username for future reference
              localStorage.setItem("telegramUsername", formattedUsername);
            }
          } catch (error) {
            console.error('Error during Telegram admin check:', error);
          }
          
          setLoading(false);
          return;
        }
      }
      
      // If not in Telegram or couldn't get user, try from localStorage
      const storedUsername = localStorage.getItem("telegramUsername");
      
      if (storedUsername) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_username', storedUsername)
            .eq('is_admin', true)
            .single();
          
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            setCurrentUser(null);
            localStorage.removeItem("telegramUsername");
          } else if (data) {
            // Found admin user in database
            setIsAdmin(true);
            setCurrentUser({
              id: data.id,
              telegram_username: data.telegram_username,
              name: data.name || '',
              is_admin: data.is_admin
            });
          } else {
            setIsAdmin(false);
            setCurrentUser(null);
            localStorage.removeItem("telegramUsername");
          }
        } catch (error) {
          console.error('Error during admin check:', error);
          setIsAdmin(false);
          setCurrentUser(null);
          localStorage.removeItem("telegramUsername");
        }
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
      }
      
      setLoading(false);
    };
    
    checkAdminStatus();
  }, []);
  
  // Login function
  const login = async (username: string) => {
    setLoading(true);
    
    // Format username to start with @ if it doesn't already
    const formattedUsername = username.startsWith('@') ? username : `@${username}`;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_username', formattedUsername)
        .eq('is_admin', true)
        .single();
      
      if (error) {
        console.error('Error during login:', error);
        setIsAdmin(false);
        setCurrentUser(null);
        setLoading(false);
        return false;
      }
      
      if (data) {
        localStorage.setItem("telegramUsername", formattedUsername);
        setIsAdmin(true);
        setCurrentUser({
          id: data.id,
          telegram_username: data.telegram_username,
          name: data.name || '',
          is_admin: data.is_admin
        });
        setLoading(false);
        return true;
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      setIsAdmin(false);
      setCurrentUser(null);
      setLoading(false);
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem("telegramUsername");
    setIsAdmin(false);
    setCurrentUser(null);
    toast.success("Вы успешно вышли из системы");
  };
  
  // Context value
  const value = {
    isAdmin,
    loading,
    currentUser,
    login,
    logout
  };
  
  // Provider return
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// Hook to use the admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  
  return context;
}
