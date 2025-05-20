
import { supabase } from "./supabaseClient";
import { Json } from "./database.types";

// Создаем таблицу настроек если она не существует
export const initializeSettingsTable = async () => {
  try {
    // Пробуем создать таблицу настроек напрямую SQL-запросом
    try {
      const { error } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL,
            value JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });

      if (error) {
        console.error("Error creating settings table with RPC:", error);
        return await createSettingsTableFallback();
      }
    } catch (e) {
      console.error("SQL Execution failed:", e);
      // Альтернативный способ: используем запрос select и insert
      return await createSettingsTableFallback();
    }
    
    return { success: true };
  } catch (e) {
    console.error("SQL Execution failed:", e);
    // Альтернативный способ: используем запрос select и insert
    return createSettingsTableFallback();
  }
};

// Резервный способ создания таблицы настроек
const createSettingsTableFallback = async () => {
  try {
    // Проверим существование таблицы, выполнив запрос select
    const { error: checkError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    // Если таблица не существует, создаем ее и вставляем начальные данные
    if (checkError && checkError.code === '42P01') {
      try {
        // Initialize with default settings
        const defaultSettings = getDefaultSettings().data;
        
        // Save site_name setting
        await supabase.from('settings').insert({
          key: 'site_name',
          value: defaultSettings.site_name
        });
        
        // Save site_title setting
        await supabase.from('settings').insert({
          key: 'site_title',
          value: defaultSettings.site_title
        });
        
        // Save site_subtitle setting
        await supabase.from('settings').insert({
          key: 'site_subtitle',
          value: defaultSettings.site_subtitle
        });
        
        // Save contact_email setting
        await supabase.from('settings').insert({
          key: 'contact_email',
          value: defaultSettings.contact_email
        });
        
        // Save other settings in individual records
        await supabase.from('settings').insert({
          key: 'maintenance_mode',
          value: defaultSettings.maintenance_mode
        });
      } catch (e) {
        console.error("Error inserting initial settings:", e);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in createSettingsTableFallback:", error);
    return { success: false, error };
  }
};

// Преобразование из формата интерфейса в формат для сохранения в БД
const formatSettingsForSave = (settings: any) => {
  // Create an array of settings objects to save
  const settingsToSave = [
    { key: 'site_name', value: settings.siteName },
    { key: 'contact_email', value: settings.contactEmail },
    { key: 'contact_phone', value: settings.contactPhone },
    { key: 'telegram_bot', value: settings.telegramBot },
    { key: 'site_description', value: settings.siteDescription },
    { key: 'site_title', value: settings.siteTitle },
    { key: 'site_subtitle', value: settings.siteSubtitle },
    { key: 'enable_notifications', value: settings.enableNotifications },
    { key: 'telegram_notifications', value: settings.telegramNotifications },
    { key: 'maintenance_mode', value: settings.maintenanceMode }
  ];
  
  return settingsToSave;
};

// Преобразование из формата БД в формат интерфейса
const formatSettingsForUI = (dbSettings: any[]) => {
  // Create a settings object with default values
  const settings = {
    siteName: "Фермерские продукты",
    contactEmail: "contact@example.com",
    contactPhone: "+7 (999) 123-45-67",
    telegramBot: "@farm_products_bot",
    siteDescription: "Доставка свежих фермерских продуктов прямо к вам домой.",
    siteTitle: "Свежие фермерские продукты с доставкой",
    siteSubtitle: "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
    enableNotifications: true,
    telegramNotifications: true,
    maintenanceMode: false
  };
  
  // Update settings from database values
  dbSettings.forEach(setting => {
    switch (setting.key) {
      case 'site_name':
        settings.siteName = setting.value;
        break;
      case 'contact_email':
        settings.contactEmail = setting.value;
        break;
      case 'contact_phone':
        settings.contactPhone = setting.value;
        break;
      case 'telegram_bot':
        settings.telegramBot = setting.value;
        break;
      case 'site_description':
        settings.siteDescription = setting.value;
        break;
      case 'site_title':
        settings.siteTitle = setting.value;
        break;
      case 'site_subtitle':
        settings.siteSubtitle = setting.value;
        break;
      case 'enable_notifications':
        settings.enableNotifications = setting.value;
        break;
      case 'telegram_notifications':
        settings.telegramNotifications = setting.value;
        break;
      case 'maintenance_mode':
        settings.maintenanceMode = setting.value;
        break;
    }
  });
  
  return settings;
};

// Clear localStorage except for essential items
const cleanupLocalStorage = () => {
  try {
    // Keep only the most important data
    const keysToKeep = ['selectedComplex', 'cart', 'authToken', 'adminUser'];
    
    // Get all keys currently in localStorage
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i));
    }
    
    // Remove items that are not in the keysToKeep array
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && !key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Error cleaning up localStorage:', e);
  }
};

export const saveSettings = async (settings: any) => {
  try {
    // Clean up localStorage first
    cleanupLocalStorage();
    
    // Get settings in the format for saving to DB
    const settingsToSave = formatSettingsForSave(settings);
    
    // Save each setting individually - update if exists, insert if not
    for (const setting of settingsToSave) {
      // Check if setting exists
      const { data: existingSetting } = await supabase
        .from('settings')
        .select('id')
        .eq('key', setting.key)
        .maybeSingle();
        
      if (existingSetting) {
        // Update existing setting
        await supabase
          .from('settings')
          .update({ value: setting.value })
          .eq('key', setting.key);
      } else {
        // Insert new setting
        await supabase
          .from('settings')
          .insert(setting);
      }
    }
    
    // Сохраняем только минимально необходимые данные
    const minimalSettings = {
      site_name: settings.siteName,
      site_title: settings.siteTitle,
      site_subtitle: settings.siteSubtitle,
      maintenance_mode: settings.maintenanceMode
    };
    
    // Сохраняем данные локально в localStorage в сжатом виде
    localStorage.setItem('app_settings', JSON.stringify(minimalSettings));
    
    // Тригерим событие для обновления настроек во всем приложении
    window.dispatchEvent(new CustomEvent('settingsUpdated', { 
      detail: {
        site_name: settings.siteName,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        telegram_bot: settings.telegramBot,
        site_description: settings.siteDescription,
        site_title: settings.siteTitle,
        site_subtitle: settings.siteSubtitle,
        enable_notifications: settings.enableNotifications,
        telegram_notifications: settings.telegramNotifications,
        maintenance_mode: settings.maintenanceMode
      }
    }));
    
    // В случае успешного сохранения в localStorage
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error };
  }
};

export const fetchSettings = async () => {
  try {
    // Clean up localStorage to make room for new data
    cleanupLocalStorage();
    
    // Сначала проверяем, есть ли данные в localStorage
    const localSettings = localStorage.getItem('app_settings');
    
    if (localSettings) {
      // Если данные есть в localStorage, возвращаем их
      try {
        const settings = JSON.parse(localSettings);
        
        // Восстанавливаем полный набор данных
        return { 
          success: true, 
          data: {
            site_name: settings.site_name || "Фермерские продукты",
            contact_email: "contact@example.com",
            contact_phone: "+7 (999) 123-45-67",
            telegram_bot: "@farm_products_bot",
            site_description: "Доставка свежих фермерских продуктов прямо к вам домой.",
            site_title: settings.site_title || "Свежие фермерские продукты с доставкой",
            site_subtitle: settings.site_subtitle || "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
            enable_notifications: true,
            telegram_notifications: true,
            maintenance_mode: settings.maintenance_mode || false,
            updated_at: new Date().toISOString()
          }
        };
      } catch (e) {
        console.error("Error parsing settings from localStorage:", e);
        // If parsing fails, return default settings
        return getDefaultSettings();
      }
    }
    
    // Try to fetch settings from the database
    try {
      const { data: dbSettings, error } = await supabase
        .from('settings')
        .select('key, value');
        
      if (error) {
        console.error("Error fetching settings from database:", error);
        return getDefaultSettings();
      }
      
      if (dbSettings && dbSettings.length > 0) {
        // Transform the settings from the database
        const uiSettings = formatSettingsForUI(dbSettings);
        
        // Save to localStorage for future use
        const minimalSettings = {
          site_name: uiSettings.siteName,
          site_title: uiSettings.siteTitle,
          site_subtitle: uiSettings.siteSubtitle,
          maintenance_mode: uiSettings.maintenanceMode
        };
        
        localStorage.setItem('app_settings', JSON.stringify(minimalSettings));
        
        return { 
          success: true,
          data: {
            site_name: uiSettings.siteName,
            contact_email: uiSettings.contactEmail,
            contact_phone: uiSettings.contactPhone,
            telegram_bot: uiSettings.telegramBot,
            site_description: uiSettings.siteDescription,
            site_title: uiSettings.siteTitle,
            site_subtitle: uiSettings.siteSubtitle,
            enable_notifications: uiSettings.enableNotifications,
            telegram_notifications: uiSettings.telegramNotifications,
            maintenance_mode: uiSettings.maintenanceMode,
            updated_at: new Date().toISOString()
          }
        };
      }
    } catch (e) {
      console.error("Error processing database settings:", e);
    }
    
    // Если в localStorage нет данных, возвращаем настройки по умолчанию
    return getDefaultSettings();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Возвращаем настройки по умолчанию вместо ошибки
    return getDefaultSettings();
  }
};

const getDefaultSettings = () => {
  return { 
    success: true, 
    data: {
      site_name: "Фермерские продукты",
      contact_email: "contact@example.com",
      contact_phone: "+7 (999) 123-45-67",
      telegram_bot: "@farm_products_bot",
      site_description: "Доставка свежих фермерских продуктов прямо к вам домой.",
      site_title: "Свежие фермерские продукты с доставкой",
      site_subtitle: "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
      enable_notifications: true,
      telegram_notifications: true,
      maintenance_mode: false,
      updated_at: new Date().toISOString()
    } 
  };
};

// Получение текущих настроек без асинхронного запроса (для реактивного доступа)
export const getSettingsSync = () => {
  try {
    const localSettings = localStorage.getItem('app_settings');
    if (localSettings) {
      const parsedSettings = JSON.parse(localSettings);
      
      // Return full settings object with defaults for missing properties
      return {
        site_name: parsedSettings.site_name || "Фермерские продукты",
        contact_email: "contact@example.com",
        contact_phone: "+7 (999) 123-45-67",
        telegram_bot: "@farm_products_bot",
        site_description: "Доставка свежих фермерских продуктов прямо к вам домой.",
        site_title: parsedSettings.site_title || "Свежие фермерские продукты с доставкой",
        site_subtitle: parsedSettings.site_subtitle || "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
        enable_notifications: true,
        telegram_notifications: true,
        maintenance_mode: parsedSettings.maintenance_mode || false,
        updated_at: new Date().toISOString()
      };
    }
    
    // Возвращаем дефолтные настройки, если ничего нет
    return {
      site_name: "Фермерские продукты",
      contact_email: "contact@example.com",
      contact_phone: "+7 (999) 123-45-67",
      telegram_bot: "@farm_products_bot",
      site_description: "Доставка свежих фермерских продуктов прямо к вам домой.",
      site_title: "Свежие фермерские продукты с доставкой",
      site_subtitle: "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
      enable_notifications: true,
      telegram_notifications: true,
      maintenance_mode: false,
      updated_at: new Date().toISOString()
    };
  } catch (e) {
    console.error("Error getting settings synchronously:", e);
    return {
      site_name: "Фермерские продукты",
      contact_email: "contact@example.com",
      contact_phone: "+7 (999) 123-45-67",
      telegram_bot: "@farm_products_bot",
      site_description: "Доставка свежих фермерских продуктов прямо к вам домой.",
      site_title: "Свежие фермерские продукты с доставкой",
      site_subtitle: "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
      enable_notifications: true,
      telegram_notifications: true,
      maintenance_mode: false,
      updated_at: new Date().toISOString()
    };
  }
};
